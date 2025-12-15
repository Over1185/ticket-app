'use client'

import { Ticket } from '@/lib/db/queries'
import Link from 'next/link'

interface TicketListProps {
    tickets: Ticket[]
    onRefresh?: () => void
}

export function TicketList({ tickets }: TicketListProps) {
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
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Tickets</h2>

            {tickets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p>No hay tickets para mostrar</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="px-4 py-3 text-left font-semibold">ID</th>
                                <th className="px-4 py-3 text-left font-semibold">Título</th>
                                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                                <th className="px-4 py-3 text-left font-semibold">Prioridad</th>
                                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                                <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map((ticket) => (
                                <tr key={ticket.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-sm">#{ticket.id}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{ticket.titulo}</div>
                                        <div className="text-sm text-gray-500 truncate">{ticket.descripcion}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.estado)}`}>
                                            {formatEstado(ticket.estado)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.prioridad)}`}>
                                            {formatPrioridad(ticket.prioridad)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {new Date(ticket.fecha_creacion).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/tickets/${ticket.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Ver detalles
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
