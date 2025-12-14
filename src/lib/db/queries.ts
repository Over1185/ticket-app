import { db } from "./client";

export type Usuario = {
    id: number;
    email: string;
    nombre: string;
    rol: "cliente" | "operador" | "admin";
    password_hash: string;
    fecha_creacion: string;
    activo: number;
};

export type Ticket = {
    id: number;
    titulo: string;
    descripcion: string;
    usuario_id: number;
    estado: "abierto" | "en_progreso" | "resuelto" | "cerrado";
    prioridad: "baja" | "media" | "alta" | "critica";
    categoria: string | null;
    fecha_creacion: string;
    fecha_actualizacion: string;
    fecha_cierre: string | null;
    asignado_a: number | null;
};

export type NewTicket = {
    titulo: string;
    descripcion: string;
    usuario_id: number;
    estado: Ticket["estado"];
    prioridad: Ticket["prioridad"];
    categoria?: string | null;
    asignado_a?: number | null;
};

export type Interaccion = {
    id: number;
    ticket_id: number;
    usuario_id: number;
    tipo: "comentario" | "cambio_estado" | "asignacion" | "cierre";
    contenido: string | null;
    metadata: string | null;
    fecha_creacion: string;
    es_interno: number;
};

function mapRow<T>(row: any): T {
    return row as T;
}

export async function getUserByEmail(email: string): Promise<Usuario | null> {
    const result = await db.execute({
        sql: "SELECT * FROM usuarios WHERE email = ? AND activo = 1",
        args: [email],
    });
    return result.rows.length ? mapRow<Usuario>(result.rows[0]) : null;
}

export async function getUserById(id: number): Promise<Usuario | null> {
    const result = await db.execute({ sql: "SELECT * FROM usuarios WHERE id = ?", args: [id] });
    return result.rows.length ? mapRow<Usuario>(result.rows[0]) : null;
}

export async function listOperators(): Promise<Pick<Usuario, "id" | "nombre">[]> {
    const result = await db.execute({
        sql: "SELECT id, nombre FROM usuarios WHERE rol IN ('operador', 'admin') AND activo = 1",
    });
    return result.rows.map((row) => ({ id: Number(row.id), nombre: String(row.nombre) }));
}

export async function createUser(user: Omit<Usuario, "id" | "fecha_creacion" | "activo"> & { activo?: number }): Promise<number> {
    const result = await db.execute({
        sql: `INSERT INTO usuarios (email, nombre, rol, password_hash, activo) VALUES (?, ?, ?, ?, ?)`
        ,
        args: [user.email, user.nombre, user.rol, user.password_hash, user.activo ?? 1],
    });
    return Number(result.lastInsertRowid);
}

export async function listTickets(filters?: { estado?: Ticket["estado"]; prioridad?: Ticket["prioridad"]; limit?: number }): Promise<Ticket[]> {
    const clauses: string[] = [];
    const args: any[] = [];

    if (filters?.estado) {
        clauses.push("estado = ?");
        args.push(filters.estado);
    }
    if (filters?.prioridad) {
        clauses.push("prioridad = ?");
        args.push(filters.prioridad);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = filters?.limit ?? 50;

    const result = await db.execute({
        sql: `SELECT * FROM tickets ${where} ORDER BY fecha_creacion DESC LIMIT ?`,
        args: [...args, limit],
    });

    return result.rows.map((row) => mapRow<Ticket>(row));
}

export async function getTicketById(id: number): Promise<Ticket | null> {
    const result = await db.execute({ sql: "SELECT * FROM tickets WHERE id = ?", args: [id] });
    return result.rows.length ? mapRow<Ticket>(result.rows[0]) : null;
}

export async function createTicket(payload: NewTicket): Promise<number> {
    const result = await db.execute({
        sql: `INSERT INTO tickets (titulo, descripcion, usuario_id, estado, prioridad, categoria, fecha_creacion, fecha_actualizacion, fecha_cierre, asignado_a)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, ?)`
        ,
        args: [
            payload.titulo,
            payload.descripcion,
            payload.usuario_id,
            payload.estado,
            payload.prioridad,
            payload.categoria,
            payload.asignado_a,
        ],
    });
    return Number(result.lastInsertRowid);
}

export async function updateTicketState(ticketId: number, nuevoEstado: Ticket["estado"], fechaCierre?: string | null) {
    await db.execute({
        sql: `UPDATE tickets SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP, fecha_cierre = COALESCE(?, fecha_cierre)
          WHERE id = ?`,
        args: [nuevoEstado, fechaCierre ?? null, ticketId],
    });
}

export async function assignTicket(ticketId: number, userId: number) {
    await db.execute({
        sql: `UPDATE tickets SET asignado_a = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [userId, ticketId],
    });
}

export async function insertInteraction(payload: Omit<Interaccion, "id" | "fecha_creacion">) {
    await db.execute({
        sql: `INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, metadata, fecha_creacion, es_interno)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`
        ,
        args: [
            payload.ticket_id,
            payload.usuario_id,
            payload.tipo,
            payload.contenido,
            payload.metadata,
            payload.es_interno,
        ],
    });
}

export async function getInteractionsForTicket(ticketId: number, limit = 100): Promise<Interaccion[]> {
    const result = await db.execute({
        sql: `SELECT * FROM interacciones WHERE ticket_id = ? ORDER BY fecha_creacion DESC LIMIT ?`,
        args: [ticketId, limit],
    });
    return result.rows.map((row) => mapRow<Interaccion>(row));
}

export async function getTicketWithUser(ticketId: number): Promise<(Ticket & { usuario_email: string; usuario_nombre: string }) | null> {
    const result = await db.execute({
        sql: `SELECT t.*, u.email AS usuario_email, u.nombre AS usuario_nombre
          FROM tickets t
          JOIN usuarios u ON u.id = t.usuario_id
          WHERE t.id = ?`,
        args: [ticketId],
    });
    return result.rows.length ? mapRow<any>(result.rows[0]) : null;
}
