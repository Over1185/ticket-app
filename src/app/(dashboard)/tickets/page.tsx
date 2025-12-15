'use client'

import { useState, useEffect } from 'react'
import { TicketList } from '@/components/ticket-list'
import { TicketForm } from '@/components/ticket-form'
import { Ticket } from '@/lib/db/queries'
import { listarTickets, getUsuarioActual } from '@/app/actions/tickets'
import Link from 'next/link'

interface Usuario {
    id: number
    nombre: string
    email: string
    rol: 'cliente' | 'operador' | 'admin'
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [usuario, setUsuario] = useState<Usuario | null>(null)
    const [filtros, setFiltros] = useState({
        estado: '',
        prioridad: '',
    })

    const loadUsuario = async () => {
        const result = await getUsuarioActual()
        if ('usuario' in result && result.usuario) {
            setUsuario(result.usuario)
        }
    }

    const loadTickets = async () => {
        setIsLoading(true)
        try {
            const result = await listarTickets({
                estado: filtros.estado || undefined,
                prioridad: filtros.prioridad || undefined,
            })

            if ('tickets' in result && result.tickets) {
                setTickets(result.tickets)
            }
        } catch (error) {
            console.error('Error loading tickets:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadUsuario()
    }, [])

    useEffect(() => {
        if (usuario) {
            loadTickets()
        }
    }, [filtros, usuario])

    const handleTicketCreated = () => {
        setShowForm(false)
        loadTickets()
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
                        <TicketForm usuarioId={usuario.id} onSuccess={handleTicketCreated} />
                    </div>
                )}

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                                value={filtros.estado}
                                onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todos los estados</option>
                                <option value="abierto">🔵 Abierto</option>
                                <option value="en_progreso">🟣 En progreso</option>
                                <option value="resuelto">🟢 Resuelto</option>
                                <option value="cerrado">⚫ Cerrado</option>
                            </select>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                            <select
                                value={filtros.prioridad}
                                onChange={(e) => setFiltros((prev) => ({ ...prev, prioridad: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todas las prioridades</option>
                                <option value="baja">🟢 Baja</option>
                                <option value="media">🟡 Media</option>
                                <option value="alta">🟠 Alta</option>
                                <option value="critica">🔴 Crítica</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => setFiltros({ estado: '', prioridad: '' })}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.estado === 'abierto').length}</div>
                        <div className="text-sm text-gray-500">Abiertos</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-purple-600">{tickets.filter(t => t.estado === 'en_progreso').length}</div>
                        <div className="text-sm text-gray-500">En Progreso</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-green-600">{tickets.filter(t => t.estado === 'resuelto').length}</div>
                        <div className="text-sm text-gray-500">Resueltos</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-gray-600">{tickets.length}</div>
                        <div className="text-sm text-gray-500">Total</div>
                    </div>
                </div>

                {/* Lista de tickets */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600">Cargando tickets...</p>
                        </div>
                    ) : (
                        <TicketList tickets={tickets} onRefresh={loadTickets} />
                    )}
                </div>
            </div>
        </div>
    )
}
