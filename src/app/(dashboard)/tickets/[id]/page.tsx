'use client'

import { useState, useEffect } from 'react'
import { Ticket, Interaccion } from '@/lib/db/queries'
import { InteractionTimeline } from '@/components/interaction-timeline'
import { obtenerTicket, listarInteracciones, actualizarTicketConInteraccion, getUsuarioActual } from '@/app/actions/tickets'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Usuario {
    id: number
    nombre: string
    email: string
    rol: 'cliente' | 'operador' | 'admin'
}

export default function TicketDetailPage() {
    const params = useParams()
    const router = useRouter()
    const ticketId = parseInt(params.id as string)
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [interacciones, setInteracciones] = useState<Interaccion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [nuevoEstado, setNuevoEstado] = useState('')
    const [comentario, setComentario] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)
    const [usuario, setUsuario] = useState<Usuario | null>(null)
    const [accessError, setAccessError] = useState<string | null>(null)

    const loadUsuario = async () => {
        const result = await getUsuarioActual()
        if ('usuario' in result && result.usuario) {
            setUsuario(result.usuario)
            return result.usuario
        }
        return null
    }

    const loadTicketData = async () => {
        setIsLoading(true)
        try {
            const ticketResult = await obtenerTicket(ticketId)

            if ('error' in ticketResult) {
                setAccessError(ticketResult.error || 'Error desconocido')
                return
            }

            const interaccionesResult = await listarInteracciones(ticketId)

            if ('ticket' in ticketResult && ticketResult.ticket) {
                setTicket(ticketResult.ticket as Ticket)
                setNuevoEstado((ticketResult.ticket as Ticket).estado)
            }

            if ('interacciones' in interaccionesResult && interaccionesResult.interacciones) {
                setInteracciones(interaccionesResult.interacciones as Interaccion[])
            }
        } catch (error) {
            console.error('Error loading ticket:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const init = async () => {
            await loadUsuario()
            await loadTicketData()
        }
        init()
    }, [ticketId])

    const handleEstadoChange = async () => {
        if (!ticket || nuevoEstado === ticket.estado || !usuario) return

        setIsUpdating(true)
        try {
            const result = await actualizarTicketConInteraccion(
                ticketId,
                nuevoEstado,
                usuario.id,
                comentario || undefined
            )

            if ('resultado' in result) {
                await loadTicketData()
                setComentario('')
            } else if ('error' in result) {
                alert(result.error)
            }
        } catch (error) {
            console.error('Error updating ticket:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    // Verificar si el usuario puede cambiar el estado (operador o admin)
    const canChangeStatus = usuario && (usuario.rol === 'operador' || usuario.rol === 'admin')

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-600">Cargando...</p>
            </div>
        )
    }

    if (accessError) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{accessError}</p>
                    <Link href="/tickets" className="text-blue-600 hover:text-blue-800">
                        Volver a la lista
                    </Link>
                </div>
            </div>
        )
    }

    if (!ticket) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Ticket no encontrado</p>
                    <Link href="/tickets" className="text-blue-600 hover:text-blue-800">
                        Volver a la lista
                    </Link>
                </div>
            </div>
        )
    }

    const formatEstado = (estado: string): string => {
        const estados: Record<string, string> = {
            abierto: 'Abierto',
            en_progreso: 'En Progreso',
            resuelto: 'Resuelto',
            cerrado: 'Cerrado',
        }
        return estados[estado] || estado
    }

    const formatPrioridad = (prioridad: string): string => {
        const prioridades: Record<string, string> = {
            baja: 'Baja',
            media: 'Media',
            alta: 'Alta',
            critica: 'Crítica',
        }
        return prioridades[prioridad] || prioridad
    }

    const getPriorityColor = (prioridad: string) => {
        switch (prioridad) {
            case 'critica':
                return 'bg-red-100 text-red-800'
            case 'alta':
                return 'bg-orange-100 text-orange-800'
            case 'media':
                return 'bg-yellow-100 text-yellow-800'
            case 'baja':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'abierto':
                return 'bg-blue-100 text-blue-800'
            case 'en_progreso':
                return 'bg-purple-100 text-purple-800'
            case 'resuelto':
                return 'bg-green-100 text-green-800'
            case 'cerrado':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-6">
                <Link href="/tickets" className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
                    ← Volver a Tickets
                </Link>

                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">#{ticket.id} - {ticket.titulo}</h1>
                            <p className="text-gray-600">{ticket.descripcion}</p>
                        </div>
                        <div className="space-y-2">
                            <span
                                className={`block px-4 py-2 rounded-full text-center font-medium ${getStatusColor(
                                    ticket.estado
                                )}`}
                            >
                                {formatEstado(ticket.estado)}
                            </span>
                            <span
                                className={`block px-4 py-2 rounded-full text-center font-medium ${getPriorityColor(
                                    ticket.prioridad
                                )}`}
                            >
                                {formatPrioridad(ticket.prioridad)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                            <p>
                                <strong>Creado:</strong>{' '}
                                {new Date(ticket.fecha_creacion).toLocaleString('es-ES')}
                            </p>
                        </div>
                        <div>
                            <p>
                                <strong>Actualizado:</strong>{' '}
                                {new Date(ticket.fecha_actualizacion).toLocaleString('es-ES')}
                            </p>
                        </div>
                        {ticket.categoria && (
                            <div>
                                <p>
                                    <strong>Categoría:</strong> {ticket.categoria}
                                </p>
                            </div>
                        )}
                        {ticket.fecha_cierre && (
                            <div>
                                <p>
                                    <strong>Cerrado:</strong> {new Date(ticket.fecha_cierre).toLocaleString('es-ES')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cambiar Estado - Solo visible para operadores y admins */}
                {ticket.estado !== 'cerrado' && canChangeStatus && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h3 className="text-xl font-bold mb-4">Cambiar Estado</h3>
                        <div className="space-y-4">
                            <select
                                value={nuevoEstado}
                                onChange={(e) => setNuevoEstado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="abierto">Abierto</option>
                                <option value="en_progreso">En Progreso</option>
                                <option value="resuelto">Resuelto</option>
                                <option value="cerrado">Cerrado</option>
                            </select>

                            <textarea
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                placeholder="Añade un comentario (opcional)"
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />

                            <button
                                onClick={handleEstadoChange}
                                disabled={isUpdating || nuevoEstado === ticket.estado}
                                className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                            >
                                {isUpdating ? 'Actualizando...' : 'Actualizar Estado'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Timeline de interacciones */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <InteractionTimeline
                        ticketId={ticketId}
                        usuarioId={usuario?.id || 0}
                        interacciones={interacciones}
                        onInteractionCreated={loadTicketData}
                    />
                </div>
            </div>
        </div>
    )
}
