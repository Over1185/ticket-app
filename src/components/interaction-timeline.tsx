import type { Interaccion } from "@/lib/db/queries";

const labels: Record<Interaccion["tipo"], string> = {
    comentario: "Comentario",
    cambio_estado: "Cambio de estado",
    asignacion: "Asignación",
    cierre: "Cierre",
};

export function InteractionTimeline({ interactions }: { interactions: Interaccion[] }) {
    return (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-zinc-800">Historial</h3>
            <div className="space-y-2">
                {interactions.map((interaction) => (
                    <div key={interaction.id} className="flex gap-3 border-b border-zinc-100 pb-2 last:border-none">
                        <div className="text-xs font-semibold text-indigo-700">{labels[interaction.tipo]}</div>
                        <div className="flex-1 text-xs text-zinc-700">
                            <p className="mb-1">{interaction.contenido}</p>
                            <p className="text-[11px] text-zinc-500">{new Date(interaction.fecha_creacion).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
