'use client'

import { useState, useTransition } from 'react'
import { TicketList } from '@/components/ticket-list'
import { TicketForm } from '@/components/ticket-form'
import { Ticket } from '@/lib/db/queries'
import { useRouter } from 'next/navigation'

interface Usuario {
    id: number
    nombre: string
    email: string
    rol: 'cliente' | 'operador' | 'admin'
}

interface TicketListClientProps {
    initialTickets: Ticket[]
    usuario: Usuario
    filters: { estado?: string; prioridad?: string }
}

export function TicketListClient({ initialTickets, usuario, filters }: TicketListClientProps) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [filtros, setFiltros] = useState(filters)

    const handleTicketCreated = () => {
        setShowForm(false)
        // Usar transition para actualizar sin bloquear la UI
        startTransition(() => {
            router.refresh()
        })
    }

    const handleFilterChange = (newFilters: typeof filtros) => {
        setFiltros(newFilters)
        const params = new URLSearchParams()
        if (newFilters.estado) params.set('estado', newFilters.estado)
        if (newFilters.prioridad) params.set('prioridad', newFilters.prioridad)

        startTransition(() => {
            router.push(`/tickets?${params.toString()}`)
        })
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Centro de Tickets</h1>
                            <p className="mt-1 text-gray-500">
                                Gestiona y da seguimiento a los tickets de soporte
                            </p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            disabled={isPending}
                        >
                            {showForm ? (
                                <>
                                    <span>✕</span>
                                    <span>Cancelar</span>
                                </>
                            ) : (
                                <>
                                    <span>+</span>
                                    <span>Nuevo Ticket</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Formulario de nuevo ticket */}
                {showForm && usuario && (
                    <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-4">Crear Nuevo Ticket</h2>
                        <TicketForm usuarioId={usuario.id} onSuccess={handleTicketCreated} />
                    </div>
                )}

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado
                            </label>
                            <select
                                value={filtros.estado || ''}
                                onChange={(e) => handleFilterChange({ ...filtros, estado: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isPending}
                            >
                                <option value="">Todos</option>
                                <option value="abierto">Abierto</option>
                                <option value="en_progreso">En Progreso</option>
                                <option value="resuelto">Resuelto</option>
                                <option value="cerrado">Cerrado</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prioridad
                            </label>
                            <select
                                value={filtros.prioridad || ''}
                                onChange={(e) => handleFilterChange({ ...filtros, prioridad: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isPending}
                            >
                                <option value="">Todas</option>
                                <option value="baja">Baja</option>
                                <option value="media">Media</option>
                                <option value="alta">Alta</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista de tickets */}
                <div className={isPending ? 'opacity-50' : ''}>
                    <TicketList tickets={initialTickets} />
                </div>
            </div>
        </div>
    )
}
