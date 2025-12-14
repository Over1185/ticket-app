import { crearTicketAction } from "@/app/actions/tickets";
import type { Usuario } from "@/lib/db/queries";

export function TicketForm({
    userId,
    operadores,
}: {
    userId: number;
    operadores: Pick<Usuario, "id" | "nombre">[];
}) {
    return (
        <form action={crearTicketAction} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <input type="hidden" name="usuario_id" value={userId} />

            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-700">Título</label>
                <input
                    name="titulo"
                    required
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Ej. Error en factura"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-700">Descripción</label>
                <textarea
                    name="descripcion"
                    required
                    className="min-h-[120px] rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Describe el problema"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-700">Prioridad</label>
                    <select
                        name="prioridad"
                        className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        defaultValue="media"
                    >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-700">Asignar a</label>
                    <select
                        name="asignado_a"
                        className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        defaultValue=""
                    >
                        <option value="">Sin asignar</option>
                        {operadores.map((op) => (
                            <option key={op.id} value={op.id}>
                                {op.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-700">Categoría</label>
                <input
                    name="categoria"
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Ej. facturacion"
                />
            </div>

            <button
                type="submit"
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
                Crear ticket
            </button>
        </form>
    );
}
