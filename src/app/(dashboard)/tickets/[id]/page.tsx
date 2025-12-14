import Link from "next/link";
import { notFound } from "next/navigation";
import { crearInteraccionAction } from "@/app/actions/tickets";
import { InteractionTimeline } from "@/components/interaction-timeline";
import { getInteractionsForTicket, getTicketById } from "@/lib/db/queries";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
    const ticketId = Number(params.id);
    const ticket = await getTicketById(ticketId);
    if (!ticket) return notFound();

    const interactions = await getInteractionsForTicket(ticketId, 50);

    return (
        <div className="min-h-screen bg-zinc-50 px-6 py-10">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Link href="/tickets" className="text-indigo-600 hover:underline">
                        Tickets
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-zinc-900">#{ticket.id}</span>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2">
                        <p className="text-xs uppercase tracking-[0.15em] text-indigo-700">Ticket</p>
                        <h1 className="text-2xl font-bold text-zinc-900">{ticket.titulo}</h1>
                        <p className="text-sm text-zinc-700">{ticket.descripcion}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-zinc-600">
                            <span>Estado: {ticket.estado}</span>
                            <span>Prioridad: {ticket.prioridad}</span>
                            <span>Creado: {new Date(ticket.fecha_creacion).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <InteractionTimeline interactions={interactions} />
                    </div>

                    <div className="lg:col-span-1">
                        <form action={crearInteraccionAction} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                            <input type="hidden" name="ticket_id" value={ticket.id} />
                            <input type="hidden" name="usuario_id" value={1} />

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-zinc-800">Tipo</label>
                                <select
                                    name="tipo"
                                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    defaultValue="comentario"
                                >
                                    <option value="comentario">Comentario</option>
                                    <option value="cambio_estado">Cambio de estado</option>
                                    <option value="asignacion">Asignación</option>
                                    <option value="cierre">Cierre</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-600">
                                <input type="checkbox" name="es_interno" id="es_interno" className="h-4 w-4" />
                                <label htmlFor="es_interno">Solo operadores</label>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-zinc-800">Contenido</label>
                                <textarea
                                    name="contenido"
                                    required
                                    className="min-h-[120px] rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    placeholder="Añade un comentario"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                                Agregar interacción
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
