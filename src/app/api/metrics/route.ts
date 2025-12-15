import { NextResponse } from 'next/server'
import { query } from '@/lib/db/client'
import { redis } from '@/lib/redis/client'
import { getQueueLength } from '@/lib/redis/queue'
import { clearAllCache } from '@/lib/redis/cache'

/**
 * GET /api/metrics
 * Retorna métricas completas del sistema: base de datos, Redis y estadísticas
 */
export async function GET() {
    const startTime = Date.now()

    try {
        const metrics: {
            database: {
                status: 'online' | 'error'
                latency_ms: number
                tables: {
                    usuarios: { count: number; activos: number }
                    tickets: { count: number; por_estado: Record<string, number>; por_prioridad: Record<string, number> }
                    interacciones: { count: number; por_tipo: Record<string, number> }
                }
                indices: string[]
            }
            redis: {
                status: 'online' | 'error'
                latency_ms: number
                keyspace: { keys: number }
                queue: { pending_tasks: number }
            }
            system: {
                uptime: number
                memory: NodeJS.MemoryUsage
                node_version: string
            }
            timestamp: string
            response_time_ms: number
        } = {
            database: {
                status: 'online',
                latency_ms: 0,
                tables: {
                    usuarios: { count: 0, activos: 0 },
                    tickets: { count: 0, por_estado: {}, por_prioridad: {} },
                    interacciones: { count: 0, por_tipo: {} },
                },
                indices: [],
            },
            redis: {
                status: 'online',
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
            // Ejecutar todas las queries en paralelo para mejor rendimiento
            const [
                usuariosTotal,
                usuariosActivos,
                ticketsTotal,
                ticketsPorEstado,
                ticketsPorPrioridad,
                interaccionesTotal,
                interaccionesPorTipo,
                indices,
            ] = await Promise.all([
                query<{ count: number }>('SELECT COUNT(*) as count FROM usuarios'),
                query<{ count: number }>('SELECT COUNT(*) as count FROM usuarios WHERE activo = 1'),
                query<{ count: number }>('SELECT COUNT(*) as count FROM tickets'),
                query<{ estado: string; count: number }>('SELECT estado, COUNT(*) as count FROM tickets GROUP BY estado'),
                query<{ prioridad: string; count: number }>('SELECT prioridad, COUNT(*) as count FROM tickets GROUP BY prioridad'),
                query<{ count: number }>('SELECT COUNT(*) as count FROM interacciones'),
                query<{ tipo: string; count: number }>('SELECT tipo, COUNT(*) as count FROM interacciones GROUP BY tipo'),
                query<{ name: string }>("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"),
            ])

            metrics.database.tables.usuarios.count = usuariosTotal[0]?.count || 0
            metrics.database.tables.usuarios.activos = usuariosActivos[0]?.count || 0
            metrics.database.tables.tickets.count = ticketsTotal[0]?.count || 0
            metrics.database.tables.interacciones.count = interaccionesTotal[0]?.count || 0
            metrics.database.indices = indices.map(i => i.name)

            for (const row of ticketsPorEstado) {
                metrics.database.tables.tickets.por_estado[row.estado] = row.count
            }
            for (const row of ticketsPorPrioridad) {
                metrics.database.tables.tickets.por_prioridad[row.prioridad] = row.count
            }
            for (const row of interaccionesPorTipo) {
                metrics.database.tables.interacciones.por_tipo[row.tipo] = row.count
            }

            metrics.database.latency_ms = Date.now() - dbStartTime
        } catch (error) {
            console.error('Error getting database metrics:', error)
            metrics.database.status = 'error'
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
            metrics.redis.status = 'error'
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

/**
 * DELETE /api/metrics
 * Limpia el caché de Redis
 */
export async function DELETE() {
    try {
        const result = await clearAllCache()
        return NextResponse.json({
            success: true,
            message: `Caché limpiado: ${result.deleted} keys eliminadas`,
            deleted: result.deleted,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Error clearing cache:', error)
        return NextResponse.json(
            { error: 'Error al limpiar el caché' },
            { status: 500 }
        )
    }
}
