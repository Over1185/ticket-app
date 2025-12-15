'use client'

import { useState, useTransition } from 'react'
import { Ticket, Interaccion } from '@/lib/db/queries'
import { InteractionTimeline } from '@/components/interaction-timeline'
import { actualizarTicketConInteraccion } from '@/app/actions/tickets'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Usuario {
    id: number
    nombre: string
    email: string
    rol: 'cliente' | 'operador' | 'admin'
}

interface TicketDetailClientProps {
    ticket: Ticket
    interacciones: Interaccion[]
    usuario: Usuario
}

export function TicketDetailClient({ ticket, interacciones, usuario }: TicketDetailClientProps) {
    const router = useRouter()
    const [nuevoEstado, setNuevoEstado] = useState<string>(ticket.estado)
    const [comentario, setComentario] = useState('')
    const [isPending, startTransition] = useTransition()

    const handleEstadoChange = async () => {
        if (nuevoEstado === ticket.estado || !usuario) return

        startTransition(async () => {
            const result = await actualizarTicketConInteraccion(
                ticket.id,
                nuevoEstado,
                usuario.id,
                comentario || undefined
            )

            if ('resultado' in result) {
                setComentario('')
                router.refresh()
            } else if ('error' in result) {
                alert(result.error)
            }
        })
    }

    const canChangeStatus = usuario && (usuario.rol === 'operador' || usuario.rol === 'admin')

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'abierto':
                return <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">🔵 Abierto</span>
            case 'en_progreso':
                return <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">🟣 En Progreso</span>
            case 'resuelto':
                return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">🟢 Resuelto</span>
            case 'cerrado':
                return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">⚫ Cerrado</span>
            default:
                return null
        }
    }

    const getPrioridadBadge = (prioridad: string) => {
        switch (prioridad) {
            case 'baja':
                return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">🟢 Baja</span>
            case 'media':
                return <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">🟡 Media</span>
            case 'alta':
                return <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded-full">🟠 Alta</span>
            case 'critica':
                return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">🔴 Crítica</span>
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link href="/tickets" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        ← Volver a tickets
                    </Link>
                </div>

                {/* Ticket Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.titulo}</h1>
                            <div className="flex gap-2 mb-4">
                                {getEstadoBadge(ticket.estado)}
                                {getPrioridadBadge(ticket.prioridad)}
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            <p>Ticket #{ticket.id}</p>
                            <p>{new Date(ticket.fecha_creacion).toLocaleDateString('es-ES')}</p>
                        </div>
                    </div>
                    <div className="prose max-w-none">
                        <p className="text-gray-700">{ticket.descripcion}</p>
                    </div>
                    {ticket.categoria && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-500">Categoría: </span>
                            <span className="text-sm font-medium text-gray-900">{ticket.categoria}</span>
                        </div>
                    )}
                </div>

                {/* Cambiar Estado (solo para operadores y admins) */}
                {canChangeStatus && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actualizar Estado</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nuevo Estado
                                </label>
                                <select
                                    value={nuevoEstado}
                                    onChange={(e) => setNuevoEstado(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isPending}
                                >
                                    <option value="abierto">Abierto</option>
                                    <option value="en_progreso">En Progreso</option>
                                    <option value="resuelto">Resuelto</option>
                                    <option value="cerrado">Cerrado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Comentario (opcional)
                                </label>
                                <textarea
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Agrega un comentario sobre este cambio..."
                                    disabled={isPending}
                                />
                            </div>
                            <button
                                onClick={handleEstadoChange}
                                disabled={nuevoEstado === ticket.estado || isPending}
                                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isPending ? 'Actualizando...' : 'Actualizar Ticket'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Timeline de Interacciones */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Actividad</h2>
                    <InteractionTimeline
                        ticketId={ticket.id}
                        usuarioId={usuario.id}
                        interacciones={interacciones}
                        onInteractionCreated={() => router.refresh()}
                    />
                </div>
            </div>
        </div>
    )
}
