import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'
import { redis } from '@/lib/redis/client'
import { getQueueLength } from '@/lib/redis/queue'

/**
 * GET /api/metrics
 * Retorna métricas completas del sistema: base de datos, Redis y estadísticas
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now()

    try {
        const metrics = {
            database: {
                status: 'online' as const,
                latency_ms: 0,
                tables: {
                    usuarios: { count: 0, activos: 0 },
                    tickets: { count: 0, por_estado: {} as Record<string, number>, por_prioridad: {} as Record<string, number> },
                    interacciones: { count: 0, por_tipo: {} as Record<string, number> },
                },
                indices: [] as string[],
            },
            redis: {
                status: 'online' as const,
                latency_ms: 0,
                keyspace: {
                    keys: 0,
                },
                queue: {
                    pending_tasks: 0,
                },
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                node_version: process.version,
            },
            timestamp: new Date().toISOString(),
            response_time_ms: 0,
        }

        // ========== Métricas de Base de Datos ==========
        const dbStartTime = Date.now()

        try {
            // Conteo de usuarios
            const usuariosTotal = await query<{ count: number }>(
                'SELECT COUNT(*) as count FROM usuarios'
            )
            const usuariosActivos = await query<{ count: number }>(
                'SELECT COUNT(*) as count FROM usuarios WHERE activo = 1'
            )
            metrics.database.tables.usuarios.count = usuariosTotal[0]?.count || 0
            metrics.database.tables.usuarios.activos = usuariosActivos[0]?.count || 0

            // Conteo de tickets
            const ticketsTotal = await query<{ count: number }>(
                'SELECT COUNT(*) as count FROM tickets'
            )
            metrics.database.tables.tickets.count = ticketsTotal[0]?.count || 0

            // Tickets por estado
            const ticketsPorEstado = await query<{ estado: string; count: number }>(
                'SELECT estado, COUNT(*) as count FROM tickets GROUP BY estado'
            )
            for (const row of ticketsPorEstado) {
                metrics.database.tables.tickets.por_estado[row.estado] = row.count
            }

            // Tickets por prioridad
            const ticketsPorPrioridad = await query<{ prioridad: string; count: number }>(
                'SELECT prioridad, COUNT(*) as count FROM tickets GROUP BY prioridad'
            )
            for (const row of ticketsPorPrioridad) {
                metrics.database.tables.tickets.por_prioridad[row.prioridad] = row.count
            }

            // Conteo de interacciones
            const interaccionesTotal = await query<{ count: number }>(
                'SELECT COUNT(*) as count FROM interacciones'
            )
            metrics.database.tables.interacciones.count = interaccionesTotal[0]?.count || 0

            // Interacciones por tipo
            const interaccionesPorTipo = await query<{ tipo: string; count: number }>(
                'SELECT tipo, COUNT(*) as count FROM interacciones GROUP BY tipo'
            )
            for (const row of interaccionesPorTipo) {
                metrics.database.tables.interacciones.por_tipo[row.tipo] = row.count
            }

            // Lista de índices
            const indices = await query<{ name: string }>(
                "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
            )
            metrics.database.indices = indices.map(i => i.name)

            metrics.database.latency_ms = Date.now() - dbStartTime
        } catch (error) {
            console.error('Error getting database metrics:', error)
            metrics.database.status = 'error' as any
        }

        // ========== Métricas de Redis ==========
        const redisStartTime = Date.now()

        try {
            // Cantidad de keys
            const dbSize = await redis.dbsize()
            metrics.redis.keyspace.keys = dbSize

            // Cola de tareas
            const queueLength = await getQueueLength()
            metrics.redis.queue.pending_tasks = queueLength

            metrics.redis.latency_ms = Date.now() - redisStartTime
        } catch (error) {
            console.error('Error getting Redis metrics:', error)
            metrics.redis.status = 'error' as any
        }

        // Tiempo total de respuesta
        metrics.response_time_ms = Date.now() - startTime

        return NextResponse.json(metrics, {
            status: 200,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
        })
    } catch (error) {
        console.error('Error in metrics endpoint:', error)
        return NextResponse.json(
            {
                error: 'Error al obtener métricas',
                timestamp: new Date().toISOString(),
                response_time_ms: Date.now() - startTime,
            },
            { status: 500 }
        )
    }
}
