import { redis } from './client'

const CACHE_TTL = 300 // 5 minutos por defecto

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
        return cached ? JSON.parse(cached as string) : null
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
        return cached ? JSON.parse(cached as string) : null
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
