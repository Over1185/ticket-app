import { hash, compare } from 'bcryptjs'
import { z } from 'zod'

// Esquema de validación de usuario
export const UserCredentialsSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type UserCredentials = z.infer<typeof UserCredentialsSchema>

/**
 * Genera un hash de contraseña
 */
export async function hashPassword(password: string): Promise<string> {
    return await hash(password, 10)
}

/**
 * Compara una contraseña con su hash
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return await compare(password, hash)
}

/**
 * Valida credenciales de usuario
 */
export function validateCredentials(
    email: string,
    password: string
): UserCredentials {
    return UserCredentialsSchema.parse({ email, password })
}
