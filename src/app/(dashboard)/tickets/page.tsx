import { TicketForm } from "@/components/ticket-form";
import { TicketList } from "@/components/ticket-list";
import { listOperators, listTickets } from "@/lib/db/queries";

export default async function TicketsPage() {
    const [tickets, operadores] = await Promise.all([
        listTickets({ limit: 50 }),
        listOperators(),
    ]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-indigo-50 px-6 py-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <header className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Mesa de ayuda</p>
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                        <h1 className="text-3xl font-bold text-zinc-900">Tickets</h1>
                        <p className="text-sm text-zinc-600">Base Turso + Redis (Upstash)</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-zinc-800">Últimos tickets</h2>
                            <span className="text-xs text-zinc-500">{tickets.length} resultados</span>
                        </div>
                        <TicketList tickets={tickets} />
                    </div>

                    <div className="lg:col-span-1">
                        <TicketForm userId={1} operadores={operadores} />
                    </div>
                </div>
            </div>
        </div>
    );
}
