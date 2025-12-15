'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { validateEstadoTicket, validatePrioridad, hasPermission, Role } from '@/lib/auth/permissions'
import { getSession } from '@/lib/auth/session'
import * as queries from '@/lib/db/queries'
import { invalidateTicketCache, getCachedTicket, cacheTicket, invalidateUserTicketsCache } from '@/lib/redis/cache'
import { enqueueTask } from '@/lib/redis/queue'
import { redis } from '@/lib/redis/client'
import type { Ticket } from '@/lib/db/queries'

/**
 * Serializa un objeto para que sea compatible con Client Components
 * Esto convierte objetos de la base de datos en objetos planos
 */
function serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data))
}

// Esquemas de validación
const CrearTicketSchema = z.object({
    titulo: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
    descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
    usuarioId: z.number().int().positive(),
    prioridad: z.enum(['baja', 'media', 'alta', 'critica']).optional(),
    categoria: z.string().optional(),
})

const ActualizarTicketSchema = z.object({
    ticketId: z.number().int().positive(),
    estado: z.enum(['abierto', 'en_progreso', 'resuelto', 'cerrado']).optional(),
    prioridad: z.enum(['baja', 'media', 'alta', 'critica']).optional(),
    asignadoA: z.number().int().positive().nullable().optional(),
})

const CrearInteraccionSchema = z.object({
    ticketId: z.number().int().positive(),
    usuarioId: z.number().int().positive(),
    contenido: z.string().min(1, 'El contenido no puede estar vacío'),
    esInterno: z.boolean().optional(),
})

/**
 * Obtiene la información del usuario actual de la sesión
 * Usado para verificar permisos en componentes cliente
 */
export async function getUsuarioActual() {
    try {
        const session = await getSession()
        if (!session) {
            return { error: 'No autorizado' }
        }
        return {
            success: true,
            usuario: {
                id: session.id,
                nombre: session.nombre,
                email: session.email,
                rol: session.rol,
            },
        }
    } catch (error) {
        console.error('Error getting current user:', error)
        return { error: 'Error al obtener el usuario' }
    }
}

/**
 * Crea un nuevo ticket
 */
export async function crearTicket(datos: unknown) {
    try {
        const { titulo, descripcion, usuarioId, prioridad = 'media', categoria } =
            CrearTicketSchema.parse(datos)

        const prioridadValidada = validatePrioridad(prioridad)

        const ticketId = await queries.crearTicket(
            titulo,
            descripcion,
            usuarioId,
            prioridadValidada,
            categoria
        )

        // Cachear el ticket nuevo
        const ticket = await queries.obtenerTicket(ticketId)
        if (ticket) {
            await cacheTicket(ticketId, ticket)
        }

        // Invalidar lista de tickets del usuario
        const session = await getSession()
        if (session) {
            await invalidateUserTicketsCache(session.id)
        }

        // Revalidar la página de tickets
        revalidatePath('/tickets')

        return {
            success: true,
            ticketId,
            mensaje: 'Ticket creado exitosamente',
        }
    } catch (error) {
        console.error('Error creating ticket:', error)
        if (error instanceof z.ZodError) {
            return { error: error.issues[0].message }
        }
        return { error: 'Error al crear el ticket' }
    }
}

/**
 * Obtiene los detalles de un ticket
 * Verifica que el cliente solo pueda ver sus propios tickets
 */
export async function obtenerTicket(ticketId: number) {
    try {
        const session = await getSession()
        if (!session) {
            return { error: 'No autorizado' }
        }

        // Intentar obtener del caché
        const cached = await getCachedTicket(ticketId)
        let ticket: Ticket | null = cached as Ticket | null

        if (!ticket) {
            // Si no está en caché, obtener de la BD
            ticket = await queries.obtenerTicket(ticketId)
            if (!ticket) {
                return { error: 'Ticket no encontrado' }
            }
            // Cachear para próxima vez
            await cacheTicket(ticketId, ticket)
        }

        // Verificar que el cliente solo pueda ver sus propios tickets
        if (session.rol === 'cliente' && ticket.usuario_id !== session.id) {
            return { error: 'No tienes acceso a este ticket' }
        }

        return { success: true, ticket: serialize(ticket) }
    } catch (error) {
        console.error('Error fetching ticket:', error)
        return { error: 'Error al obtener el ticket' }
    }
}

/**
 * Actualiza un ticket
 */
export async function actualizarTicket(datos: unknown) {
    try {
        const { ticketId, estado, prioridad, asignadoA } =
            ActualizarTicketSchema.parse(datos)

        const estadoValidado = estado ? validateEstadoTicket(estado) : undefined
        const prioridadValidada = prioridad ? validatePrioridad(prioridad) : undefined

        // Obtener el ticket antes de actualizar para saber el usuario
        const ticket = await queries.obtenerTicket(ticketId)

        await queries.actualizarTicket(ticketId, estadoValidado, prioridadValidada, asignadoA)

        // Invalidar caché del ticket y de las listas
        await invalidateTicketCache(ticketId)
        if (ticket) {
            await invalidateUserTicketsCache(ticket.usuario_id)
        }

        // Revalidar páginas
        revalidatePath('/tickets')
        revalidatePath(`/tickets/${ticketId}`)

        return {
            success: true,
            mensaje: 'Ticket actualizado exitosamente',
        }
    } catch (error) {
        console.error('Error updating ticket:', error)
        if (error instanceof z.ZodError) {
            return { error: error.issues[0].message }
        }
        return { error: 'Error al actualizar el ticket' }
    }
}

/**
 * Actualiza el estado del ticket y crea una interacción en una transacción
 * Garantiza consistencia: o ambas operaciones se ejecutan o ninguna
 * Solo operadores y administradores pueden cambiar el estado
 */
export async function actualizarTicketConInteraccion(
    ticketId: number,
    nuevoEstado: string,
    usuarioId: number,
    comentario?: string
) {
    try {
        // Verificar permisos - solo operador y admin pueden cambiar estado
        const session = await getSession()
        if (!session) {
            return { error: 'No autorizado' }
        }

        if (!hasPermission(session.rol as Role, 'tickets.update')) {
            return { error: 'No tienes permisos para cambiar el estado del ticket' }
        }

        const estadoValidado = validateEstadoTicket(nuevoEstado)

        // Obtener el ticket para saber el usuario
        const ticket = await queries.obtenerTicket(ticketId)

        const resultado = await queries.actualizarTicketConInteraccion(
            ticketId,
            estadoValidado,
            session.id, // Usar el ID de la sesión en lugar del parámetro
            comentario
        )

        // Invalidar caché del ticket, interacciones y listas
        await Promise.all([
            invalidateTicketCache(ticketId),
            ticket ? invalidateUserTicketsCache(ticket.usuario_id) : Promise.resolve(),
            redis.del(`interactions:${ticketId}`)
        ])

        // Revalidar las páginas para que se actualicen en tiempo real
        revalidatePath('/tickets')
        revalidatePath(`/tickets/${ticketId}`)

        return {
            success: true,
            resultado,
            mensaje: 'Ticket actualizado y interacción registrada',
        }
    } catch (error) {
        console.error('Error updating ticket with interaction:', error)
        if (error instanceof z.ZodError) {
            return { error: error.issues[0].message }
        }
        return { error: 'Error al actualizar el ticket' }
    }
}

/**
 * Asigna un ticket a un operador
 */
export async function asignarTicket(
    ticketId: number,
    operadorId: number,
    usuarioQuienAsigna: number
) {
    try {
        const resultado = await queries.asignarTicketConInteraccion(
            ticketId,
            operadorId,
            usuarioQuienAsigna
        )

        // Invalidar caché
        await invalidateTicketCache(ticketId)

        // Revalidar las páginas para que se actualicen en tiempo real
        revalidatePath('/tickets')
        revalidatePath(`/tickets/${ticketId}`)

        return {
            success: true,
            resultado,
            mensaje: 'Ticket asignado exitosamente',
        }
    } catch (error) {
        console.error('Error assigning ticket:', error)
        return { error: 'Error al asignar el ticket' }
    }
}

/**
 * Cierra un ticket
 */
export async function cerrarTicket(
    ticketId: number,
    usuarioId: number,
    comentario?: string
) {
    try {
        const resultado = await queries.cerrarTicketConInteraccion(
            ticketId,
            usuarioId,
            comentario
        )

        // Invalidar caché
        await invalidateTicketCache(ticketId)

        // Revalidar las páginas para que se actualicen en tiempo real
        revalidatePath('/tickets')
        revalidatePath(`/tickets/${ticketId}`)

        return {
            success: true,
            resultado,
            mensaje: 'Ticket cerrado exitosamente',
        }
    } catch (error) {
        console.error('Error closing ticket:', error)
        return { error: 'Error al cerrar el ticket' }
    }
}

/**
 * Lista los tickets del usuario
 */
export async function listarTicketosDelUsuario(usuarioId: number) {
    try {
        const tickets = await queries.listarTicketsDelUsuario(usuarioId)
        return { success: true, tickets: serialize(tickets) }
    } catch (error) {
        console.error('Error listing user tickets:', error)
        return { error: 'Error al listar los tickets' }
    }
}

/**
 * Lista todos los tickets (con filtros opcionales)
 * Aplica filtros según el rol del usuario
 */
export async function listarTickets(filtros?: {
    estado?: string
    usuarioId?: number
    asignadoA?: number
    prioridad?: string
}) {
    try {
        const session = await getSession()
        if (!session) {
            return { error: 'No autorizado' }
        }

        const filtrosValidados: any = {}

        if (filtros?.estado) {
            filtrosValidados.estado = validateEstadoTicket(filtros.estado)
        }
        if (filtros?.prioridad) {
            filtrosValidados.prioridad = validatePrioridad(filtros.prioridad)
        }
        if (filtros?.asignadoA) {
            filtrosValidados.asignadoA = filtros.asignadoA
        }

        // Cliente solo puede ver sus propios tickets
        if (session.rol === 'cliente') {
            filtrosValidados.usuarioId = session.id
        } else if (filtros?.usuarioId) {
            filtrosValidados.usuarioId = filtros.usuarioId
        }

        const tickets = await queries.listarTickets(filtrosValidados)
        return { success: true, tickets: serialize(tickets) }
    } catch (error) {
        console.error('Error listing tickets:', error)
        if (error instanceof z.ZodError) {
            return { error: error.issues[0].message }
        }
        return { error: 'Error al listar los tickets' }
    }
}

/**
 * Crea una interacción (comentario) en un ticket
 */
export async function crearInteraccion(datos: unknown) {
    try {
        const { ticketId, usuarioId, contenido, esInterno = false } =
            CrearInteraccionSchema.parse(datos)

        const interaccionId = await queries.crearInteraccion(
            ticketId,
            usuarioId,
            'comentario',
            contenido,
            undefined,
            esInterno
        )

        // Invalidar caché del ticket
        await invalidateTicketCache(ticketId)

        return {
            success: true,
            interaccionId,
            mensaje: 'Comentario añadido exitosamente',
        }
    } catch (error) {
        console.error('Error creating interaction:', error)
        if (error instanceof z.ZodError) {
            return { error: error.issues[0].message }
        }
        return { error: 'Error al añadir el comentario' }
    }
}

/**
 * Lista las interacciones de un ticket
 */
export async function listarInteracciones(ticketId: number) {
    try {
        const interacciones = await queries.listarInteraccionesDelTicket(ticketId)
        return { success: true, interacciones: serialize(interacciones) }
    } catch (error) {
        console.error('Error listing interactions:', error)
        return { error: 'Error al listar las interacciones' }
    }
}

/**
 * Lista las interacciones públicas de un ticket (sin las internas)
 */
export async function listarInteraccionesPublicas(ticketId: number) {
    try {
        const interacciones = await queries.listarInteraccionesPublicas(ticketId)
        return { success: true, interacciones: serialize(interacciones) }
    } catch (error) {
        console.error('Error listing public interactions:', error)
        return { error: 'Error al listar las interacciones' }
    }
}
