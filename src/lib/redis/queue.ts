import { redis } from "./client";

export type TaskPayload = {
    type: string;
    payload: unknown;
    timestamp: number;
};

export async function enqueueTask(taskType: string, payload: unknown) {
    const task: TaskPayload = {
        type: taskType,
        payload,
        timestamp: Date.now(),
    };
    await redis.rpush("tasks:pending", JSON.stringify(task));
}

export async function processBatchTasks() {
    const raw = await redis.lpop("tasks:pending");
    if (!raw) return null;

    const task = JSON.parse(raw as string) as TaskPayload;

    // Simple router placeholder
    switch (task.type) {
        case "close_inactive_tickets":
            // Implementar: cerrar tickets inactivos, enviar notificaciones, etc.
            break;
        default:
            break;
    }

    return task;
}
