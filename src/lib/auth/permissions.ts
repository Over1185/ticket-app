import { z } from 'zod'

// Esquemas de validación
export const RoleSchema = z.enum(['cliente', 'operador', 'admin'])
export const EstadoTicketSchema = z.enum([
    'abierto',
    'en_progreso',
    'resuelto',
    'cerrado',
])
export const PrioridadSchema = z.enum(['baja', 'media', 'alta', 'critica'])
export const TipoInteraccionSchema = z.enum([
    'comentario',
    'cambio_estado',
    'asignacion',
    'cierre',
])

export type Role = z.infer<typeof RoleSchema>
export type EstadoTicket = z.infer<typeof EstadoTicketSchema>
export type Prioridad = z.infer<typeof PrioridadSchema>
export type TipoInteraccion = z.infer<typeof TipoInteraccionSchema>

// Definición de permisos por rol
const ROLE_PERMISSIONS: Record<Role, string[]> = {
    cliente: [
        'usuarios.select_self',
        'tickets.create',
        'tickets.select_own',
        'interacciones.select_own',
        'interacciones.create_own',
    ],
    operador: [
        'usuarios.select',
        'tickets.select',
        'tickets.update',
        'tickets.assign',
        'interacciones.select',
        'interacciones.create',
        'interacciones.create_internal',
    ],
    admin: ['*'],
}

/**
 * Verifica si un rol tiene permisos para realizar una acción
 */
export function hasPermission(userRole: Role, action: string): boolean {
    if (userRole === 'admin') {
        return true
    }

    const permissions = ROLE_PERMISSIONS[userRole] || []
    return permissions.includes(action) || permissions.includes('*')
}

/**
 * Validación de rol
 */
export function validateRole(role: string): Role {
    return RoleSchema.parse(role)
}

/**
 * Validación de estado de ticket
 */
export function validateEstadoTicket(estado: string): EstadoTicket {
    return EstadoTicketSchema.parse(estado)
}

/**
 * Validación de prioridad
 */
export function validatePrioridad(prioridad: string): Prioridad {
    return PrioridadSchema.parse(prioridad)
}

/**
 * Validación de tipo de interacción
 */
export function validateTipoInteraccion(tipo: string): TipoInteraccion {
    return TipoInteraccionSchema.parse(tipo)
}

/**
 * Obtiene todos los permisos de un rol (para documentación)
 */
export function getRolePermissions(role: Role): string[] {
    return ROLE_PERMISSIONS[role] || []
}

/**
 * Lista todos los roles disponibles
 */
export function getAllRoles(): Role[] {
    return Object.keys(ROLE_PERMISSIONS) as Role[]
}
