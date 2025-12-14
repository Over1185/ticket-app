import { NextResponse } from "next/server";
import { z } from "zod";
import { createTicket, listTickets } from "@/lib/db/queries";

const createTicketSchema = z.object({
    titulo: z.string().min(3),
    descripcion: z.string().min(5),
    usuario_id: z.number().int().positive(),
    prioridad: z.enum(["baja", "media", "alta", "critica"]).default("media"),
    categoria: z.string().optional().nullable(),
    asignado_a: z.number().int().positive().optional().nullable(),
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") ?? undefined;
    const prioridad = searchParams.get("prioridad") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? 50);

    const tickets = await listTickets({
        estado: estado as any,
        prioridad: prioridad as any,
        limit,
    });

    return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
    const body = await request.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.message }, { status: 400 });
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
        return NextResponse.json({ ticketId: id }, { status: 201 });
    } catch (error) {
        console.error("Error creando ticket API", error);
        return NextResponse.json({ error: "No se pudo crear el ticket" }, { status: 500 });
    }
}
