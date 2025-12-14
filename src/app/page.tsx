import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50 px-6 py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700">Ticket Desk</p>
          <h1 className="text-4xl font-bold text-zinc-900">Soporte unificado con Turso + Redis</h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            Sistema completo de mesa de ayuda con transacciones, caché, colas y métricas. Ingresa para gestionar tickets y ver el historial de interacciones.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tickets"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Ir al dashboard
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:border-indigo-400"
            >
              Crear usuario demo
            </Link>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">Turso</h3>
            <p className="text-sm text-zinc-600">Transacciones ACID para tickets e interacciones.</p>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">Redis</h3>
            <p className="text-sm text-zinc-600">Caché de usuarios y colas para trabajos batch.</p>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">Métricas</h3>
            <p className="text-sm text-zinc-600">Endpoint /api/metrics para observar el sistema.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
