import { redis } from './client'

const CACHE_TTL = 300 // 5 minutos por defecto

/**
 * Parsea datos del caché de forma segura
 * Upstash Redis puede devolver objetos ya parseados o strings
 */
function safeParseCache<T>(cached: unknown): T | null {
    if (cached === null || cached === undefined) {
        return null
    }
    // Si ya es un objeto, devolverlo directamente
    if (typeof cached === 'object') {
        return cached as T
    }
    // Si es string, intentar parsear
    if (typeof cached === 'string') {
        try {
            return JSON.parse(cached) as T
        } catch {
            return null
        }
    }
    return null
}

/**
 * Guarda un usuario en caché
 */
export async function cacheUser(userId: number, userData: any) {
    try {
        await redis.set(`user:${userId}`, JSON.stringify(userData), {
            ex: CACHE_TTL,
        })
    } catch (error) {
        console.error('Cache user error:', error)
        // No lanzar error, el caché es opcional
    }
}

/**
 * Obtiene un usuario del caché
 */
export async function getCachedUser(userId: number) {
    try {
        const cached = await redis.get(`user:${userId}`)
        return safeParseCache(cached)
    } catch (error) {
        console.error('Get cached user error:', error)
        return null
    }
}

/**
 * Invalida el caché de un usuario
 */
export async function invalidateUserCache(userId: number) {
    try {
        await redis.del(`user:${userId}`)
    } catch (error) {
        console.error('Invalidate user cache error:', error)
    }
}

/**
 * Guarda tickets en caché
 */
export async function cacheTicket(ticketId: number, ticketData: any) {
    try {
        await redis.set(`ticket:${ticketId}`, JSON.stringify(ticketData), {
            ex: CACHE_TTL,
        })
    } catch (error) {
        console.error('Cache ticket error:', error)
    }
}

/**
 * Obtiene un ticket del caché
 */
export async function getCachedTicket(ticketId: number) {
    try {
        const cached = await redis.get(`ticket:${ticketId}`)
        return safeParseCache(cached)
    } catch (error) {
        console.error('Get cached ticket error:', error)
        return null
    }
}

/**
 * Invalida el caché de un ticket
 */
export async function invalidateTicketCache(ticketId: number) {
    try {
        await redis.del(`ticket:${ticketId}`)
    } catch (error) {
        console.error('Invalidate ticket cache error:', error)
    }
}

/**
 * Invalida todos los caché relacionados con tickets de un usuario
 */
export async function invalidateUserTicketsCache(userId: number) {
    try {
        // Obtener todas las claves de tickets del usuario
        const pattern = `tickets:user:${userId}:*`
        const keys = await redis.keys(pattern)

        if (keys && keys.length > 0) {
            await redis.del(...keys)
        }
    } catch (error) {
        console.error('Invalidate user tickets cache error:', error)
    }
}

/**
 * Limpia todo el caché de tickets y usuarios
 */
export async function clearAllCache(): Promise<{ deleted: number }> {
    try {
        // Obtener todas las keys que empiecen con ticket: o user:
        const ticketKeys = await redis.keys('ticket:*')
        const userKeys = await redis.keys('user:*')
        const allKeys = [...ticketKeys, ...userKeys]

        if (allKeys.length > 0) {
            await redis.del(...allKeys)
        }

        return { deleted: allKeys.length }
    } catch (error) {
        console.error('Clear all cache error:', error)
        return { deleted: 0 }
    }
}
