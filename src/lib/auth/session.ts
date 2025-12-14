import { cookies } from "next/headers";
import { type RoleKey } from "./permissions";

export type Session = {
    userId: number;
    role: RoleKey;
};

// Nota: para producción se recomienda integrar NextAuth; esto es un stub de ejemplo.
export async function getSession(): Promise<Session> {
    const cookieStore = cookies();
    const role = (cookieStore.get("role")?.value as RoleKey) || "api_server";
    const userId = Number(cookieStore.get("userId")?.value ?? 1);
    return { userId, role };
}
