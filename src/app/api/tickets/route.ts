import { NextRequest, NextResponse } from 'next/server'
import * as queries from '@/lib/db/queries'

/**
 * GET /api/tickets
 * Lista todos los tickets con filtros opcionales
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        const estado = searchParams.get('estado')
        const usuarioId = searchParams.get('usuarioId')
        const asignadoA = searchParams.get('asignadoA')
        const prioridad = searchParams.get('prioridad')

        const filtros: any = {}
        if (estado) filtros.estado = estado
        if (usuarioId) filtros.usuarioId = parseInt(usuarioId)
        if (asignadoA) filtros.asignadoA = parseInt(asignadoA)
        if (prioridad) filtros.prioridad = prioridad

        const tickets = await queries.listarTickets(filtros)

        return NextResponse.json(
            { success: true, tickets, count: tickets.length },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in GET /api/tickets:', error)
        return NextResponse.json(
            { error: 'Error al obtener tickets' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/tickets
 * Crea un nuevo ticket (mismo que crearTicket server action, para compatibilidad REST)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const { titulo, descripcion, usuarioId, prioridad = 'media', categoria } = body

        if (!titulo || !descripcion || !usuarioId) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            )
        }

        const ticketId = await queries.crearTicket(
            titulo,
            descripcion,
            usuarioId,
            prioridad,
            categoria
        )

        const ticket = await queries.obtenerTicket(ticketId)

        return NextResponse.json(
            { success: true, ticketId, ticket },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error in POST /api/tickets:', error)
        return NextResponse.json(
            { error: 'Error al crear el ticket' },
            { status: 500 }
        )
    }
}
