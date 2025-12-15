import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import * as queries from '@/lib/db/queries'
import { TicketDetailClient } from '@/components/ticket-detail-client'
import { redirect } from 'next/navigation'
import { redis } from '@/lib/redis/client'
import TicketDetailLoading from './loading'
import Link from 'next/link'

// Revalidar cada 15 segundos para obtener las interacciones más recientes
export const revalidate = 15

interface TicketDetailPageProps {
    params: Promise<{ id: string }>
}

async function getCachedTicket(ticketId: number) {
    try {
        const cached = await redis.get(`ticket:${ticketId}`)
        if (cached) {
            return typeof cached === 'string' ? JSON.parse(cached) : cached
        }
        return null
    } catch {
        return null
    }
}

async function getCachedInteracciones(ticketId: number) {
    try {
        const cached = await redis.get(`interactions:${ticketId}`)
        if (cached) {
            return typeof cached === 'string' ? JSON.parse(cached) : cached
        }
        return null
    } catch {
        return null
    }
}

async function setCachedData(key: string, data: unknown, ttl = 15) {
    try {
        await redis.set(key, JSON.stringify(data), { ex: ttl })
    } catch (error) {
        console.error('Error caching data:', error)
    }
}

// Serializa los datos para pasarlos a Client Components
function serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data))
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    const { id } = await params
    const ticketId = parseInt(id)

    if (isNaN(ticketId)) {
        redirect('/tickets')
    }

    // Fetch ticket y interacciones en paralelo
    const [cachedTicket, cachedInteracciones] = await Promise.all([
        getCachedTicket(ticketId),
        getCachedInteracciones(ticketId)
    ])

    let ticket = cachedTicket
    let interacciones = cachedInteracciones

    // Si no están en caché, obtener de la BD en paralelo
    if (!ticket || !interacciones) {
        const [ticketData, interaccionesData] = await Promise.all([
            ticket || queries.obtenerTicket(ticketId),
            interacciones || queries.listarInteraccionesDelTicket(ticketId)
        ])

        ticket = ticketData
        interacciones = interaccionesData

        // Cachear en paralelo sin esperar
        if (ticket) setCachedData(`ticket:${ticketId}`, ticket)
        if (interacciones) setCachedData(`interactions:${ticketId}`, interacciones)
    }

    if (!ticket) {
        redirect('/tickets')
    }

    // Verificar permisos: clientes solo pueden ver sus propios tickets
    if (session.rol === 'cliente' && ticket.usuario_id !== session.id) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
                    <p className="text-gray-600 mb-4">No tienes permiso para ver este ticket</p>
                    <Link href="/tickets" className="text-blue-600 hover:text-blue-700">
                        Volver a tickets
                    </Link>
                </div>
            </div>
        )
    }

    // Serializar datos antes de pasar a Client Component
    const serializedTicket = serialize(ticket)
    const serializedInteracciones = serialize(interacciones || [])
    const serializedSession = serialize(session)

    return (
        <Suspense fallback={<TicketDetailLoading />}>
            <TicketDetailClient
                ticket={serializedTicket}
                interacciones={serializedInteracciones}
                usuario={serializedSession}
            />
        </Suspense>
    )
}
