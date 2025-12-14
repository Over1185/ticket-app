import { NextResponse } from "next/server";
import { processBatchTasks } from "@/lib/redis/queue";

export async function POST() {
    const task = await processBatchTasks();
    if (!task) return NextResponse.json({ processed: false, message: "No hay tareas pendientes" });
    return NextResponse.json({ processed: true, task });
}
