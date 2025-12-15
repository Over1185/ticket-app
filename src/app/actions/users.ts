'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hashPassword, verifyPassword, createSession, getSession, destroySession, SessionUser } from '@/lib/auth/session'
import { validateRole, validatePrioridad, validateEstadoTicket } from '@/lib/auth/permissions'
import * as queries from '@/lib/db/queries'
import { cacheUser, invalidateUserCache, getCachedUser } from '@/lib/redis/cache'

/**
 * Serializa un objeto para que sea compatible con Client Components
 */
function serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data))
}

// Esquemas de validación
const CrearUsuarioSchema = z.object({
    email: z.string().email('Email inválido'),
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    rol: z.enum(['cliente', 'operador', 'admin']),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const LoginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña requerida'),
})

/**
 * Crea un nuevo usuario
 */
export async function crearUsuario(datos: unknown) {
    try {
        const { email, nombre, rol, password } = CrearUsuarioSchema.parse(datos)
        const roleValidado = validateRole(rol)

        // Verificar que el email no exista
        const usuarioExistente = await queries.obtenerUsuarioPorEmail(email)
        if (usuarioExistente) {
            return { error: 'El email ya está registrado' }
        }

        // Hash de la contraseña
        const passwordHash = await hashPassword(password)

        // Crear usuario
        const usuarioId = await queries.crearUsuario(
            email,
            nombre,
            roleValidado,
            passwordHash
        )

        // Cachear el usuario
        const usuario = await queries.obtenerUsuario(usuarioId)
        if (usuario) {
            await cacheUser(usuarioId, usuario)
        }

        return {
            success: true,
            usuarioId,
            mensaje: 'Usuario creado exitosamente',
        }
    } catch (error) {
        console.error('Error creating user:', error)
        if (error instanceof z.ZodError) {
            return { error: error.issues[0].message }
        }
        return { error: 'Error al crear el usuario' }
    }
}

/**
 * Autentica un usuario
 */
export async function loginUsuario(datos: unknown) {
    try {
        const { email, password } = LoginSchema.parse(datos)

        // Buscar usuario
        const usuario = await queries.obtenerUsuarioPorEmail(email)
        if (!usuario || !usuario.activo) {
            return { error: 'Email o contraseña inválidos' }
        }

        // Verificar contraseña
        const passwordValida = await verifyPassword(password, usuario.password_hash)
        if (!passwordValida) {
            return { error: 'Email o contraseña inválidos' }
        }

        // Crear sesión del usuario
        const sessionUser: SessionUser = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol as 'cliente' | 'operador' | 'admin',
        }
        await createSession(sessionUser)

        // Cachear usuario
        await cacheUser(usuario.id, usuario)

        // Revalidar todas las rutas para actualizar la sesión
        revalidatePath('/', 'layout')

        return {
            success: true,
            usuario: sessionUser,
        }
    } catch (error) {
        console.error('Error logging in:', error)
        if (error instanceof z.ZodError) {
            return { error: error.issues[0].message }
        }
        return { error: 'Error al iniciar sesión' }
    }
}

/**
 * Autentica un usuario y redirige automáticamente
 */
export async function loginAndRedirect(datos: unknown) {
    const result = await loginUsuario(datos)

    if ('error' in result) {
        return result
    }

    // Si el login fue exitoso, redirigir
    redirect('/tickets')
}

/**
 * Obtiene la sesión del usuario actual
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
    return await getSession()
}

/**
 * Cierra la sesión del usuario
 */
export async function logoutUsuario() {
    await destroySession()
    revalidatePath('/', 'layout')
    return { success: true, mensaje: 'Sesión cerrada exitosamente' }
}

/**
 * Obtiene los datos de un usuario
 */
export async function obtenerUsuario(usuarioId: number) {
    try {
        // Intentar obtener del caché primero
        const cached = await getCachedUser(usuarioId)
        if (cached) {
            return { success: true, usuario: serialize(cached) }
        }

        // Si no está en caché, obtener de la BD
        const usuario = await queries.obtenerUsuario(usuarioId)
        if (!usuario) {
            return { error: 'Usuario no encontrado' }
        }

        // Cachear para próxima vez
        await cacheUser(usuarioId, usuario)

        return { success: true, usuario: serialize(usuario) }
    } catch (error) {
        console.error('Error fetching user:', error)
        return { error: 'Error al obtener el usuario' }
    }
}

/**
 * Actualiza los datos de un usuario
 */
export async function actualizarUsuario(usuarioId: number, datos: unknown) {
    try {
        const schema = z.object({
            nombre: z.string().min(2).optional(),
            activo: z.boolean().optional(),
        })

        const { nombre, activo } = schema.parse(datos)

        await queries.actualizarUsuario(usuarioId, nombre, activo)

        // Invalidar caché
        await invalidateUserCache(usuarioId)

        return {
            success: true,
            mensaje: 'Usuario actualizado exitosamente',
        }
    } catch (error) {
        console.error('Error updating user:', error)
        if (error instanceof z.ZodError) {
            return { error: error.issues[0].message }
        }
        return { error: 'Error al actualizar el usuario' }
    }
}

/**
 * Lista todos los usuarios activos
 */
export async function listarUsuarios() {
    try {
        const usuarios = await queries.listarUsuarios()
        return { success: true, usuarios: serialize(usuarios) }
    } catch (error) {
        console.error('Error listing users:', error)
        return { error: 'Error al listar usuarios' }
    }
}
