'use client'

import { Interaccion } from '@/lib/db/queries'
import { useState } from 'react'
import { crearInteraccion } from '@/app/actions/tickets'

interface InteractionTimelineProps {
    ticketId: number
    usuarioId: number
    interacciones: Interaccion[]
    onInteractionCreated?: () => void
}

export function InteractionTimeline({
    ticketId,
    usuarioId,
    interacciones,
    onInteractionCreated,
}: InteractionTimelineProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [contenido, setContenido] = useState('')
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
        null
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            const result = await crearInteraccion({
                ticketId,
                usuarioId,
                contenido,
                esInterno: false,
            })

            if ('error' in result) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: result.mensaje })
                setContenido('')
                onInteractionCreated?.()
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al crear el comentario' })
        } finally {
            setIsLoading(false)
        }
    }

    const getTypeLabel = (tipo: string): string => {
        const labels: Record<string, string> = {
            comentario: '💬 Comentario',
            cambio_estado: '🔄 Cambio de Estado',
            asignacion: '👤 Asignación',
            cierre: '✅ Cierre de Ticket',
        }
        return labels[tipo] || tipo
    }

    const formatMetadata = (metadata: string, tipo: string): string | null => {
        try {
            const data = JSON.parse(metadata)

            // Para cambios de estado, mostrar un texto legible
            if (tipo === 'cambio_estado') {
                if (data.estado_anterior && data.estado_nuevo) {
                    const formatEstado = (estado: string): string => {
                        const estados: Record<string, string> = {
                            abierto: 'Abierto',
                            en_progreso: 'En Progreso',
                            resuelto: 'Resuelto',
                            cerrado: 'Cerrado',
                        }
                        return estados[estado] || estado
                    }
                    return `Estado cambiado de "${formatEstado(data.estado_anterior)}" a "${formatEstado(data.estado_nuevo)}"`
                }
                // Si solo tiene razón, no mostrar nada (el contenido ya tiene la info)
                if (data.razon) {
                    return null
                }
            }

            // Para asignaciones
            if (tipo === 'asignacion' && data.operador_id) {
                return `Asignado al operador #${data.operador_id}`
            }

            // Para otros casos, no mostrar el JSON crudo
            return null
        } catch {
            return null
        }
    }

    const getTypeColor = (tipo: string): string => {
        switch (tipo) {
            case 'comentario':
                return 'bg-blue-50 border-blue-200'
            case 'cambio_estado':
                return 'bg-purple-50 border-purple-200'
            case 'asignacion':
                return 'bg-orange-50 border-orange-200'
            case 'cierre':
                return 'bg-green-50 border-green-200'
            default:
                return 'bg-gray-50 border-gray-200'
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h3 className="text-2xl font-bold mb-6">Actividad del Ticket</h3>

            {/* Timeline de interacciones */}
            <div className="mb-8 space-y-4">
                {interacciones.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay interacciones aún</p>
                ) : (
                    interacciones.map((interaccion) => (
                        <div
                            key={interaccion.id}
                            className={`border-l-4 p-4 rounded-r ${getTypeColor(interaccion.tipo)}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-gray-900">
                                        {getTypeLabel(interaccion.tipo)}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {new Date(interaccion.fecha_creacion).toLocaleString('es-ES')}
                                    </p>
                                </div>
                                {interaccion.es_interno && (
                                    <span className="bg-red-200 text-red-800 px-3 py-1 rounded text-xs font-medium">
                                        Interno
                                    </span>
                                )}
                            </div>

                            {interaccion.contenido && (
                                <p className="mt-3 text-gray-700 whitespace-pre-wrap">{interaccion.contenido}</p>
                            )}

                            {interaccion.metadata && formatMetadata(interaccion.metadata, interaccion.tipo) && (
                                <p className="mt-2 text-sm text-gray-600 italic">
                                    {formatMetadata(interaccion.metadata, interaccion.tipo)}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Formulario de nuevo comentario */}
            <form onSubmit={handleSubmit} className="border-t pt-6">
                <h4 className="font-semibold mb-4">Añadir Comentario</h4>

                {message && (
                    <div
                        className={`p-4 mb-4 rounded ${message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <textarea
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                    required
                    minLength={1}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                    placeholder="Escribe tu comentario..."
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                    {isLoading ? 'Enviando...' : 'Enviar Comentario'}
                </button>
            </form>
        </div>
    )
}
