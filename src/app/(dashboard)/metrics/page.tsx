'use client'

import { useState, useEffect } from 'react'

interface Metrics {
    database: {
        status: string
        latency_ms: number
        tables: {
            usuarios: { count: number; activos: number }
            tickets: { count: number; por_estado: Record<string, number>; por_prioridad: Record<string, number> }
            interacciones: { count: number; por_tipo: Record<string, number> }
        }
        indices: string[]
    }
    redis: {
        status: string
        latency_ms: number
        keyspace: { keys: number }
        queue: { pending_tasks: number }
    }
    system: {
        uptime: number
        memory: {
            heapUsed: number
            heapTotal: number
            rss: number
        }
        node_version: string
    }
    timestamp: string
    response_time_ms: number
}

export default function MetricsPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/metrics')
            if (!response.ok) throw new Error('Error al obtener métricas')
            const data = await response.json()
            setMetrics(data)
            setLastUpdate(new Date())
            setError(null)
        } catch (err) {
            setError('Error al cargar métricas')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMetrics()
        const interval = setInterval(fetchMetrics, 30000) // Actualizar cada 30 segundos
        return () => clearInterval(interval)
    }, [])

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatUptime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${minutes}m`
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Cargando métricas...</p>
                </div>
            </div>
        )
    }

    if (error || !metrics) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 text-xl">{error || 'Error desconocido'}</p>
                    <button
                        onClick={fetchMetrics}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard de Métricas</h1>
                        <p className="text-gray-500 mt-1">
                            Última actualización: {lastUpdate?.toLocaleTimeString('es-ES')}
                        </p>
                    </div>
                    <button
                        onClick={fetchMetrics}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        🔄 Actualizar
                    </button>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Base de Datos</p>
                                <p className={`text-2xl font-bold ${metrics.database.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.database.status === 'online' ? '🟢 Online' : '🔴 Error'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Latencia</p>
                                <p className="text-lg font-semibold">{metrics.database.latency_ms}ms</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Redis Cache</p>
                                <p className={`text-2xl font-bold ${metrics.redis.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.redis.status === 'online' ? '🟢 Online' : '🔴 Error'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Latencia</p>
                                <p className="text-lg font-semibold">{metrics.redis.latency_ms}ms</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Tiempo de Respuesta</p>
                                <p className={`text-2xl font-bold ${metrics.response_time_ms < 200 ? 'text-green-600' : metrics.response_time_ms < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {metrics.response_time_ms}ms
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Uptime</p>
                                <p className="text-lg font-semibold">{formatUptime(metrics.system.uptime)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Cola de Tareas</p>
                                <p className={`text-2xl font-bold ${metrics.redis.queue.pending_tasks === 0 ? 'text-green-600' : metrics.redis.queue.pending_tasks < 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {metrics.redis.queue.pending_tasks}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Keys en Redis</p>
                                <p className="text-lg font-semibold">{metrics.redis.keyspace.keys}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold mb-4">🗄️ Estadísticas de Base de Datos</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">Usuarios Totales</span>
                                <span className="font-semibold">{metrics.database.tables.usuarios.count}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">Usuarios Activos</span>
                                <span className="font-semibold text-green-600">{metrics.database.tables.usuarios.activos}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">Tickets Totales</span>
                                <span className="font-semibold">{metrics.database.tables.tickets.count}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">Interacciones Totales</span>
                                <span className="font-semibold">{metrics.database.tables.interacciones.count}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600">Índices Creados</span>
                                <span className="font-semibold">{metrics.database.indices.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold mb-4">🎫 Tickets por Estado</h2>
                        <div className="space-y-3">
                            {Object.entries(metrics.database.tables.tickets.por_estado).map(([estado, count]) => {
                                const colors: Record<string, string> = {
                                    abierto: 'bg-blue-500',
                                    en_progreso: 'bg-purple-500',
                                    resuelto: 'bg-green-500',
                                    cerrado: 'bg-gray-500',
                                }
                                const total = metrics.database.tables.tickets.count || 1
                                const percentage = Math.round((count / total) * 100)

                                return (
                                    <div key={estado}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="capitalize">{estado.replace('_', ' ')}</span>
                                            <span className="font-semibold">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${colors[estado] || 'bg-gray-500'}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Priority and Interactions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold mb-4">⚡ Tickets por Prioridad</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(metrics.database.tables.tickets.por_prioridad).map(([prioridad, count]) => {
                                const colors: Record<string, string> = {
                                    baja: 'bg-green-100 text-green-800 border-green-200',
                                    media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                    alta: 'bg-orange-100 text-orange-800 border-orange-200',
                                    critica: 'bg-red-100 text-red-800 border-red-200',
                                }

                                return (
                                    <div
                                        key={prioridad}
                                        className={`p-4 rounded-lg border ${colors[prioridad] || 'bg-gray-100'}`}
                                    >
                                        <div className="text-2xl font-bold">{count}</div>
                                        <div className="text-sm capitalize">{prioridad}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold mb-4">💬 Interacciones por Tipo</h2>
                        <div className="space-y-3">
                            {Object.entries(metrics.database.tables.interacciones.por_tipo).map(([tipo, count]) => {
                                const icons: Record<string, string> = {
                                    comentario: '💬',
                                    cambio_estado: '🔄',
                                    asignacion: '👤',
                                    cierre: '✅',
                                }

                                return (
                                    <div key={tipo} className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">
                                            {icons[tipo] || '📝'} {tipo.replace('_', ' ')}
                                        </span>
                                        <span className="font-semibold">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold mb-4">🖥️ Información del Sistema</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Memoria Heap Usada</p>
                            <p className="text-lg font-semibold">{formatBytes(metrics.system.memory.heapUsed)}</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="h-2 rounded-full bg-blue-500"
                                    style={{ width: `${(metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">de {formatBytes(metrics.system.memory.heapTotal)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">RSS Memory</p>
                            <p className="text-lg font-semibold">{formatBytes(metrics.system.memory.rss)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Node.js Version</p>
                            <p className="text-lg font-semibold">{metrics.system.node_version}</p>
                        </div>
                    </div>
                </div>

                {/* Indices List */}
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold mb-4">📑 Índices de Base de Datos</h2>
                    <div className="flex flex-wrap gap-2">
                        {metrics.database.indices.map((index) => (
                            <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-mono"
                            >
                                {index}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
