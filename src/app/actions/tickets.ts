'use server'

import { z } from "zod";
import { db } from "@/lib/db/client";
import {
    createTicket,
    insertInteraction,
    updateTicketState,
} from "@/lib/db/queries";
import { enqueueTask } from "@/lib/redis/queue";

const estadoSchema = z.enum(["abierto", "en_progreso", "resuelto", "cerrado"]);
const prioridadSchema = z.enum(["baja", "media", "alta", "critica"]);

const actualizarSchema = z.object({
    ticketId: z.number().int().positive(),
    nuevoEstado: estadoSchema,
    comentario: z.string().min(1),
    usuarioId: z.number().int().positive(),
});

export async function actualizarTicketConInteraccion(
    ticketId: number,
    nuevoEstado: string,
    comentario: string,
    usuarioId: number,
) {
    const parsed = actualizarSchema.safeParse({ ticketId, nuevoEstado, comentario, usuarioId });
    if (!parsed.success) {
        return { success: false, message: parsed.error.message };
    }

    const tx = await db.transaction();
    try {
        await tx.execute({
            sql: `UPDATE tickets SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
            args: [parsed.data.nuevoEstado, parsed.data.ticketId],
        });

        await tx.execute({
            sql: `INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, metadata, fecha_creacion, es_interno)
            VALUES (?, ?, 'cambio_estado', ?, json(?), CURRENT_TIMESTAMP, 0)`,
            args: [
                parsed.data.ticketId,
                parsed.data.usuarioId,
                parsed.data.comentario,
                JSON.stringify({ estado: parsed.data.nuevoEstado }),
            ],
        });

        await tx.commit();
        await enqueueTask("refresh_ticket_cache", { ticketId: parsed.data.ticketId });
        return { success: true, message: "Ticket actualizado" };
    } catch (error) {
        await tx.rollback();
        console.error("Transaction error", error);
        return { success: false, message: "No se pudo actualizar el ticket" };
    }
}

const createTicketSchema = z.object({
    titulo: z.string().min(3),
    descripcion: z.string().min(5),
    usuario_id: z.number().int().positive(),
    prioridad: prioridadSchema.default("media"),
    categoria: z.string().optional().nullable(),
    asignado_a: z.number().int().positive().optional().nullable(),
});

export async function crearTicketAction(formData: FormData) {
    const data = {
        titulo: formData.get("titulo"),
        descripcion: formData.get("descripcion"),
        usuario_id: Number(formData.get("usuario_id")),
        prioridad: formData.get("prioridad") ?? "media",
        categoria: formData.get("categoria"),
        asignado_a: formData.get("asignado_a"),
    };

    const parsed = createTicketSchema.safeParse({
        ...data,
        categoria: data.categoria ? String(data.categoria) : null,
        asignado_a: data.asignado_a ? Number(data.asignado_a) : null,
        prioridad: String(data.prioridad),
    });

    if (!parsed.success) {
        return { success: false, message: parsed.error.message };
    }

    try {
        const id = await createTicket({
            titulo: parsed.data.titulo,
            descripcion: parsed.data.descripcion,
            usuario_id: parsed.data.usuario_id,
            estado: "abierto",
            prioridad: parsed.data.prioridad,
            categoria: parsed.data.categoria ?? null,
            asignado_a: parsed.data.asignado_a ?? null,
        });

        await insertInteraction({
            ticket_id: id,
            usuario_id: parsed.data.usuario_id,
            tipo: "comentario",
            contenido: "Ticket creado",
            metadata: JSON.stringify({ createdFrom: "form" }),
            es_interno: 0,
        });

        return { success: true, message: "Ticket creado", ticketId: id };
    } catch (error) {
        console.error("Error creando ticket", error);
        return { success: false, message: "No se pudo crear el ticket" };
    }
}

const interactionSchema = z.object({
    ticket_id: z.number().int().positive(),
    usuario_id: z.number().int().positive(),
    tipo: z.enum(["comentario", "cambio_estado", "asignacion", "cierre"]),
    contenido: z.string().min(1),
    es_interno: z.boolean().default(false),
});

export async function crearInteraccionAction(formData: FormData) {
    const parsed = interactionSchema.safeParse({
        ticket_id: Number(formData.get("ticket_id")),
        usuario_id: Number(formData.get("usuario_id")),
        tipo: String(formData.get("tipo") ?? "comentario"),
        contenido: String(formData.get("contenido") ?? ""),
        es_interno: formData.get("es_interno") === "on",
    });

    if (!parsed.success) {
        return { success: false, message: parsed.error.message };
    }

    try {
        await insertInteraction({
            ticket_id: parsed.data.ticket_id,
            usuario_id: parsed.data.usuario_id,
            tipo: parsed.data.tipo,
            contenido: parsed.data.contenido,
            metadata: JSON.stringify({ source: "form" }),
            es_interno: parsed.data.es_interno ? 1 : 0,
        });
        return { success: true, message: "Interacción registrada" };
    } catch (error) {
        console.error("Error creando interacción", error);
        return { success: false, message: "No se pudo crear la interacción" };
    }
}
