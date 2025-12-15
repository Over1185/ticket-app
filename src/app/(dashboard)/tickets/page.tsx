import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import * as queries from '@/lib/db/queries'
import { TicketListClient } from '@/components/ticket-list-client'
import { redis } from '@/lib/redis/client'
import { redirect } from 'next/navigation'
import TicketsLoading from './loading'

// Revalidar cada 30 segundos
export const revalidate = 30

interface TicketsPageProps {
    searchParams: Promise<{ estado?: string; prioridad?: string }>
}

async function getCachedTickets(cacheKey: string) {
    try {
        const cached = await redis.get(cacheKey)
        if (cached) {
            return typeof cached === 'string' ? JSON.parse(cached) : cached
        }
        return null
    } catch {
        return null
    }
}

async function setCachedTickets(cacheKey: string, tickets: unknown[]) {
    try {
        await redis.set(cacheKey, JSON.stringify(tickets), { ex: 30 })
    } catch (error) {
        console.error('Error caching tickets:', error)
    }
}

// Serializa los datos para pasarlos a Client Components
function serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data))
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    const params = await searchParams
    const { estado, prioridad } = params

    // Generar clave de caché basada en filtros y usuario
    const cacheKey = `tickets:user:${session.id}:${estado || 'all'}:${prioridad || 'all'}`

    // Intentar obtener del caché
    let tickets = await getCachedTickets(cacheKey)

    if (!tickets) {
        // Si no está en caché, obtener de la BD
        if (session.rol === 'cliente') {
            tickets = await queries.listarTickets({
                usuarioId: session.id,
                estado: estado as any,
                prioridad: prioridad as any
            })
        } else {
            tickets = await queries.listarTickets({
                estado: estado as any,
                prioridad: prioridad as any
            })
        }

        // Cachear resultados
        await setCachedTickets(cacheKey, tickets)
    }

    // Serializar datos antes de pasar a Client Component
    const serializedTickets = serialize(tickets)
    const serializedSession = serialize(session)

    return (
        <Suspense fallback={<TicketsLoading />}>
            <TicketListClient
                initialTickets={serializedTickets}
                usuario={serializedSession}
                filters={{ estado, prioridad }}
            />
        </Suspense>
    )
}
