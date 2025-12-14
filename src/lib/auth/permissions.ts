export const ROLES = {
    api_server: {
        description: "Rol para el API Server (operaciones normales)",
        permissions: [
            "usuarios.select",
            "usuarios.insert",
            "usuarios.update",
            "tickets.select",
            "tickets.insert",
            "tickets.update",
            "interacciones.select",
            "interacciones.insert",
            "interacciones.update",
        ],
    },
    batch_worker: {
        description: "Rol para Batch Worker (tareas en background)",
        permissions: [
            "tickets.select",
            "tickets.update",
            "interacciones.select",
            "procedures.execute",
        ],
    },
    admin: {
        description: "Administrador con acceso completo",
        permissions: ["*"],
    },
} as const;

export type RoleKey = keyof typeof ROLES;

export function checkPermission(userRole: RoleKey, action: string): boolean {
    const role = ROLES[userRole];
    if (!role) return false;
    if (role.permissions.includes("*")) return true;
    return role.permissions.includes(action);
}

export function requirePermission(userRole: RoleKey, action: string) {
    if (!checkPermission(userRole, action)) {
        throw new Error(`Acceso denegado para ${userRole} en accion ${action}`);
    }
}
