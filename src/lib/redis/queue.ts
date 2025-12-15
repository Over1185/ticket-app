import { redis } from './client'

export interface Task {
    type: 'close_inactive_tickets' | 'send_notifications' | 'archive_old_interactions'
    payload: any
    timestamp: number
}

const TASKS_QUEUE_KEY = 'tasks:pending'

/**
 * Agrega una tarea a la cola
 */
export async function enqueueTask(task: Omit<Task, 'timestamp'>) {
    try {
        await redis.rpush(
            TASKS_QUEUE_KEY,
            JSON.stringify({
                ...task,
                timestamp: Date.now(),
            } as Task)
        )
    } catch (error) {
        console.error('Enqueue task error:', error)
    }
}

/**
 * Procesa la siguiente tarea de la cola
 */
export async function dequeueTask(): Promise<Task | null> {
    try {
        const taskJson = await redis.lpop(TASKS_QUEUE_KEY)
        return taskJson ? (JSON.parse(taskJson as string) as Task) : null
    } catch (error) {
        console.error('Dequeue task error:', error)
        return null
    }
}

/**
 * Obtiene la longitud actual de la cola
 */
export async function getQueueLength(): Promise<number> {
    try {
        return await redis.llen(TASKS_QUEUE_KEY)
    } catch (error) {
        console.error('Get queue length error:', error)
        return 0
    }
}
