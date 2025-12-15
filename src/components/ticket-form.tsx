'use client'

import { useState, useTransition } from 'react'
import { crearTicket } from '@/app/actions/tickets'

interface TicketFormProps {
    usuarioId: number
    onSuccess?: () => void
}

export function TicketForm({ usuarioId, onSuccess }: TicketFormProps) {
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
        null
    )
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        categoria: '',
    })

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        startTransition(async () => {
            try {
                const result = await crearTicket({
                    ...formData,
                    usuarioId,
                })

                if ('error' in result && result.error) {
                    setMessage({ type: 'error', text: result.error })
                } else {
                    setMessage({ type: 'success', text: result.mensaje || 'Ticket creado exitosamente' })
                    setFormData({
                        titulo: '',
                        descripcion: '',
                        prioridad: 'media',
                        categoria: '',
                    })
                    onSuccess?.()
                }
            } catch (error) {
                setMessage({ type: 'error', text: 'Error al crear el ticket' })
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 border rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Crear Nuevo Ticket</h2>

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

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    required
                    minLength={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Resumen breve del problema"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    required
                    minLength={10}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe detalladamente el problema"
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                    <select
                        name="prioridad"
                        value={formData.prioridad}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <input
                        type="text"
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Billing, Técnico, etc"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
                {isPending ? 'Creando...' : 'Crear Ticket'}
            </button>
        </form>
    )
}
