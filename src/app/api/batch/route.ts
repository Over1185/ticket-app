import { NextRequest, NextResponse } from 'next/server'
import { dequeueTask, getQueueLength } from '@/lib/redis/queue'
import { query } from '@/lib/db/client'

/**
 * POST /api/batch
 * Procesa tareas de la cola
 * Puede ser llamado por un cron job o invocado manualmente
 */
export async function POST(request: NextRequest) {
    try {
        const queueLength = await getQueueLength()

        if (queueLength === 0) {
            return NextResponse.json(
                { message: 'No hay tareas pendientes', processed: 0 },
                { status: 200 }
            )
        }

        let processed = 0
        let errors = 0

        // Procesar hasta 10 tareas por invocación
        for (let i = 0; i < Math.min(10, queueLength); i++) {
            const task = await dequeueTask()

            if (!task) break

            try {
                // Procesar según el tipo de tarea
                switch (task.type) {
                    case 'close_inactive_tickets':
                        await processCloseInactiveTickets(task.payload)
                        break

                    case 'send_notifications':
                        await processSendNotifications(task.payload)
                        break

                    case 'archive_old_interactions':
                        await processArchiveOldInteractions(task.payload)
                        break

                    default:
                        console.warn(`Unknown task type: ${task.type}`)
                }

                processed++
            } catch (error) {
                console.error(`Error processing task:`, error)
                errors++
            }
        }

        return NextResponse.json(
            {
                message: 'Batch processing completed',
                processed,
                errors,
                remaining: queueLength - processed,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in batch endpoint:', error)
        return NextResponse.json(
            { error: 'Error al procesar tareas' },
            { status: 500 }
        )
    }
}

/**
 * Procesa el cierre de tickets inactivos
 */
async function processCloseInactiveTickets(payload: any) {
    const { days = 7 } = payload

    // Obtener tickets abiertos que no hayan sido actualizados en X días
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - days)

    const inactiveTickets = await query<any>(
        `SELECT id FROM tickets 
     WHERE estado != 'cerrado' 
     AND fecha_actualizacion < ?
     LIMIT 100`,
        [thresholdDate.toISOString()]
    )

    // Cerrar cada ticket
    for (const ticket of inactiveTickets) {
        // await cerrarTicket(ticket.id)
        console.log(`Closed inactive ticket ${ticket.id}`)
    }
}

/**
 * Procesa el envío de notificaciones
 */
async function processSendNotifications(payload: any) {
    const { type = 'new_tickets' } = payload

    // Aquí iría la lógica real de envío de notificaciones
    // Por ahora, solo registramos
    console.log(`Processing notifications: ${type}`)
}

/**
 * Procesa el archivado de interacciones antiguas
 */
async function processArchiveOldInteractions(payload: any) {
    const { days = 90 } = payload

    // Obtener interacciones antiguas
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - days)

    const oldInteractions = await query<any>(
        `SELECT id FROM interacciones 
     WHERE fecha_creacion < ?
     LIMIT 1000`,
        [thresholdDate.toISOString()]
    )

    console.log(`Found ${oldInteractions.length} old interactions to archive`)
    // Aquí iría lógica de archivado/compresión
}
