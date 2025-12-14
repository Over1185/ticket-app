import Link from "next/link";
import type { Ticket } from "@/lib/db/queries";

function StatusBadge({ estado }: { estado: Ticket["estado"] }) {
    const colors: Record<Ticket["estado"], string> = {
        abierto: "bg-amber-100 text-amber-800",
        en_progreso: "bg-blue-100 text-blue-800",
        resuelto: "bg-emerald-100 text-emerald-800",
        cerrado: "bg-zinc-200 text-zinc-800",
    };
    return (
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${colors[estado]}`}>
            {estado.replace("_", " ")}
        </span>
    );
}

function PriorityBadge({ prioridad }: { prioridad: Ticket["prioridad"] }) {
    const colors: Record<Ticket["prioridad"], string> = {
        baja: "bg-zinc-100 text-zinc-700",
        media: "bg-sky-100 text-sky-800",
        alta: "bg-orange-100 text-orange-800",
        critica: "bg-red-100 text-red-800",
    };
    return (
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${colors[prioridad]}`}>
            {prioridad}
        </span>
    );
}

export function TicketList({ tickets }: { tickets: Ticket[] }) {
    return (
        <div className="space-y-2">
            {tickets.map((ticket) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block rounded-lg border border-zinc-200 bg-white p-4 hover:border-indigo-200">
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-zinc-900">{ticket.titulo}</p>
                            <p className="text-xs text-zinc-500">
                                #{ticket.id} • Creado: {new Date(ticket.fecha_creacion).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <PriorityBadge prioridad={ticket.prioridad} />
                            <StatusBadge estado={ticket.estado} />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
