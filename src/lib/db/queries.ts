import { query, queryOne, execute, db } from './client'
import { Role, EstadoTicket, Prioridad, TipoInteraccion } from '@/lib/auth/permissions'

// ===== TIPOS =====

export interface Usuario {
    id: number
    email: string
    nombre: string
    rol: Role
    password_hash: string
    fecha_creacion: string
    activo: boolean
}

export interface Ticket {
    id: number
    titulo: string
    descripcion: string
    usuario_id: number
    estado: EstadoTicket
    prioridad: Prioridad
    categoria: string | null
    fecha_creacion: string
    fecha_actualizacion: string
    fecha_cierre: string | null
    asignado_a: number | null
}

export interface Interaccion {
    id: number
    ticket_id: number
    usuario_id: number
    tipo: TipoInteraccion
    contenido: string | null
    metadata: string | null
    fecha_creacion: string
    es_interno: boolean
}

// ===== USUARIOS =====

export async function crearUsuario(
    email: string,
    nombre: string,
    rol: Role,
    passwordHash: string
): Promise<number> {
    const result = await execute(
        `INSERT INTO usuarios (email, nombre, rol, password_hash, activo)
     VALUES (?, ?, ?, ?, 1)`,
        [email, nombre, rol, passwordHash]
    )
    return Number(result.lastInsertRowid)
}

export async function obtenerUsuario(id: number): Promise<Usuario | null> {
    return await queryOne<Usuario>(
        'SELECT * FROM usuarios WHERE id = ?',
        [id]
    )
}

export async function obtenerUsuarioPorEmail(email: string): Promise<Usuario | null> {
    return await queryOne<Usuario>(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
    )
}

export async function actualizarUsuario(
    id: number,
    nombre?: string,
    activo?: boolean
): Promise<boolean> {
    const updates: string[] = []
    const values: any[] = []

    if (nombre !== undefined) {
        updates.push('nombre = ?')
        values.push(nombre)
    }
    if (activo !== undefined) {
        updates.push('activo = ?')
        values.push(activo ? 1 : 0)
    }

    if (updates.length === 0) return false

    values.push(id)
    await execute(
        `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
        values
    )
    return true
}

export async function listarUsuarios(): Promise<Usuario[]> {
    return await query<Usuario>(
        'SELECT * FROM usuarios WHERE activo = 1 ORDER BY fecha_creacion DESC'
    )
}

// ===== TICKETS =====

export async function crearTicket(
    titulo: string,
    descripcion: string,
    usuarioId: number,
    prioridad: Prioridad = 'media',
    categoria?: string
): Promise<number> {
    const result = await execute(
        `INSERT INTO tickets (titulo, descripcion, usuario_id, estado, prioridad, categoria, fecha_actualizacion)
     VALUES (?, ?, ?, 'abierto', ?, ?, CURRENT_TIMESTAMP)`,
        [titulo, descripcion, usuarioId, prioridad, categoria || null]
    )
    return Number(result.lastInsertRowid)
}

export async function obtenerTicket(id: number): Promise<Ticket | null> {
    return await queryOne<Ticket>(
        'SELECT * FROM tickets WHERE id = ?',
        [id]
    )
}

export async function actualizarTicket(
    id: number,
    estado?: EstadoTicket,
    prioridad?: Prioridad,
    asignadoA?: number | null
): Promise<boolean> {
    const updates: string[] = ['fecha_actualizacion = CURRENT_TIMESTAMP']
    const values: any[] = []

    if (estado !== undefined) {
        updates.push('estado = ?')
        values.push(estado)
    }
    if (prioridad !== undefined) {
        updates.push('prioridad = ?')
        values.push(prioridad)
    }
    if (asignadoA !== undefined) {
        updates.push('asignado_a = ?')
        values.push(asignadoA)
    }

    if (updates.length === 1) return false // Solo tiene fecha_actualizacion

    values.push(id)
    await execute(
        `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
        values
    )
    return true
}

export async function cerrarTicket(id: number): Promise<boolean> {
    await execute(
        `UPDATE tickets 
     SET estado = 'cerrado', fecha_cierre = CURRENT_TIMESTAMP, fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = ?`,
        [id]
    )
    return true
}

export async function listarTickets(filtros?: {
    estado?: EstadoTicket
    usuarioId?: number
    asignadoA?: number
    prioridad?: Prioridad
}): Promise<Ticket[]> {
    let sql = 'SELECT * FROM tickets WHERE 1=1'
    const values: any[] = []

    if (filtros?.estado) {
        sql += ' AND estado = ?'
        values.push(filtros.estado)
    }
    if (filtros?.usuarioId) {
        sql += ' AND usuario_id = ?'
        values.push(filtros.usuarioId)
    }
    if (filtros?.asignadoA) {
        sql += ' AND asignado_a = ?'
        values.push(filtros.asignadoA)
    }
    if (filtros?.prioridad) {
        sql += ' AND prioridad = ?'
        values.push(filtros.prioridad)
    }

    sql += ' ORDER BY id DESC'
    return await query<Ticket>(sql, values)
}

export async function listarTicketsDelUsuario(usuarioId: number): Promise<Ticket[]> {
    return await query<Ticket>(
        `SELECT * FROM tickets 
     WHERE usuario_id = ? 
     ORDER BY id DESC`,
        [usuarioId]
    )
}

// ===== INTERACCIONES =====

export async function crearInteraccion(
    ticketId: number,
    usuarioId: number,
    tipo: TipoInteraccion,
    contenido?: string,
    metadata?: Record<string, any>,
    esInterno: boolean = false
): Promise<number> {
    const result = await execute(
        `INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, metadata, es_interno)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [
            ticketId,
            usuarioId,
            tipo,
            contenido || null,
            metadata ? JSON.stringify(metadata) : null,
            esInterno ? 1 : 0,
        ]
    )
    return Number(result.lastInsertRowid)
}

export async function obtenerInteraccion(id: number): Promise<Interaccion | null> {
    return await queryOne<Interaccion>(
        'SELECT * FROM interacciones WHERE id = ?',
        [id]
    )
}

export async function listarInteraccionesDelTicket(ticketId: number): Promise<Interaccion[]> {
    return await query<Interaccion>(
        `SELECT * FROM interacciones 
     WHERE ticket_id = ? 
     ORDER BY fecha_creacion DESC`,
        [ticketId]
    )
}

export async function listarInteraccionesPublicas(ticketId: number): Promise<Interaccion[]> {
    return await query<Interaccion>(
        `SELECT * FROM interacciones 
     WHERE ticket_id = ? AND es_interno = 0
     ORDER BY fecha_creacion DESC`,
        [ticketId]
    )
}

// ===== OPERACIONES COMPLEJAS CON TRANSACCIONES =====

/**
 * Actualiza el estado de un ticket y registra la interacción en una transacción
 * Garantiza consistencia: o ambas operaciones se ejecutan o ninguna
 */
export async function actualizarTicketConInteraccion(
    ticketId: number,
    nuevoEstado: EstadoTicket,
    usuarioId: number,
    comentario?: string,
    metadata?: Record<string, any>
): Promise<{ ticketId: number; interaccionId: number }> {
    // Obtener estado anterior primero
    const ticketActual = await queryOne<{ estado: string }>(
        'SELECT estado FROM tickets WHERE id = ?',
        [ticketId]
    )
    const estadoAnterior = ticketActual?.estado || 'desconocido'

    // Combinar metadata con información del cambio de estado
    const metadataCompleto = {
        ...metadata,
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevoEstado,
    }

    // Ejecutar batch atómico con ambas operaciones
    const results = await db.batch([
        {
            sql: `UPDATE tickets 
                  SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
                  WHERE id = ?`,
            args: [nuevoEstado, ticketId],
        },
        {
            sql: `INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, metadata)
                  VALUES (?, ?, 'cambio_estado', ?, ?)`,
            args: [
                ticketId,
                usuarioId,
                comentario || null,
                JSON.stringify(metadataCompleto),
            ],
        },
    ], 'write')

    return {
        ticketId,
        interaccionId: Number(results[1].lastInsertRowid || 0),
    }
}

/**
 * Asigna un ticket a un operador y registra la interacción
 */
export async function asignarTicketConInteraccion(
    ticketId: number,
    operadorId: number,
    usuarioQuienAsigna: number
): Promise<{ ticketId: number; interaccionId: number }> {
    // Ejecutar batch atómico con ambas operaciones
    const results = await db.batch([
        {
            sql: `UPDATE tickets 
                  SET asignado_a = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
                  WHERE id = ?`,
            args: [operadorId, ticketId],
        },
        {
            sql: `INSERT INTO interacciones (ticket_id, usuario_id, tipo, metadata)
                  VALUES (?, ?, 'asignacion', ?)`,
            args: [
                ticketId,
                usuarioQuienAsigna,
                JSON.stringify({
                    asignado_a: operadorId,
                    anterior_asignado_a: null,
                }),
            ],
        },
    ], 'write')

    return {
        ticketId,
        interaccionId: Number(results[1].lastInsertRowid || 0),
    }
}

/**
 * Cierra un ticket y registra la interacción
 */
export async function cerrarTicketConInteraccion(
    ticketId: number,
    usuarioId: number,
    comentario?: string
): Promise<{ ticketId: number; interaccionId: number }> {
    // Ejecutar batch atómico con ambas operaciones
    const results = await db.batch([
        {
            sql: `UPDATE tickets 
                  SET estado = 'cerrado', fecha_cierre = CURRENT_TIMESTAMP, fecha_actualizacion = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [ticketId],
        },
        {
            sql: `INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido)
                  VALUES (?, ?, 'cierre', ?)`,
            args: [ticketId, usuarioId, comentario || null],
        },
    ], 'write')

    return {
        ticketId,
        interaccionId: Number(results[1].lastInsertRowid || 0),
    }
}
