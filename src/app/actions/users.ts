'use server'

import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, getUserByEmail } from "@/lib/db/queries";

const userSchema = z.object({
    email: z.string().email(),
    nombre: z.string().min(2),
    rol: z.enum(["cliente", "operador", "admin"]),
    password: z.string().min(8),
});

export async function registrarUsuario(formData: FormData) {
    const parsed = userSchema.safeParse({
        email: formData.get("email"),
        nombre: formData.get("nombre"),
        rol: formData.get("rol"),
        password: formData.get("password"),
    });

    if (!parsed.success) {
        return { success: false, message: parsed.error.message };
    }

    const existing = await getUserByEmail(parsed.data.email);
    if (existing) {
        return { success: false, message: "El email ya existe" };
    }

    const password_hash = await bcrypt.hash(parsed.data.password, 10);

    try {
        const id = await createUser({
            email: parsed.data.email,
            nombre: parsed.data.nombre,
            rol: parsed.data.rol,
            password_hash,
            fecha_creacion: "",
            activo: 1,
        });
        return { success: true, message: "Usuario creado", userId: id };
    } catch (error) {
        console.error("Error registrando usuario", error);
        return { success: false, message: "No se pudo crear el usuario" };
    }
}
