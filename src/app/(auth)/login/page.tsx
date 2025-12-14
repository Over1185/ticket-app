import { registrarUsuario } from "@/app/actions/users";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-zinc-50 px-6 py-10">
            <div className="mx-auto flex max-w-md flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="space-y-1 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-700">Acceso</p>
                    <h1 className="text-2xl font-bold text-zinc-900">Demo de login</h1>
                    <p className="text-sm text-zinc-600">
                        Usa este formulario para crear un usuario de prueba. Para sesión real integra NextAuth y guarda cookies de rol.
                    </p>
                </div>

                <form action={registrarUsuario} className="space-y-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-zinc-800">Email</label>
                        <input name="email" type="email" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-zinc-800">Nombre</label>
                        <input name="nombre" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-zinc-800">Rol</label>
                        <select name="rol" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" defaultValue="cliente">
                            <option value="cliente">Cliente</option>
                            <option value="operador">Operador</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-zinc-800">Password</label>
                        <input name="password" type="password" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        Registrar usuario demo
                    </button>
                </form>
            </div>
        </div>
    );
}
