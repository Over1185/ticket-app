import { hash, compare } from 'bcryptjs'
import { z } from 'zod'
import { cookies } from 'next/headers'

// Nombre de la cookie de sesión
const SESSION_COOKIE_NAME = 'ticket_session'

// Tipo de usuario de sesión
export interface SessionUser {
    id: number
    email: string
    nombre: string
    rol: 'cliente' | 'operador' | 'admin'
}

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
    hashedPassword: string
): Promise<boolean> {
    return await compare(password, hashedPassword)
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

/**
 * Crea una sesión para el usuario (guarda en cookie)
 */
export async function createSession(user: SessionUser): Promise<void> {
    const cookieStore = await cookies()

    // Codificar datos del usuario en Base64
    const sessionData = Buffer.from(JSON.stringify(user)).toString('base64')

    cookieStore.set(SESSION_COOKIE_NAME, sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 días
    })
}

/**
 * Obtiene la sesión del usuario actual
 */
export async function getSession(): Promise<SessionUser | null> {
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

        if (!sessionCookie?.value) {
            return null
        }

        // Decodificar datos del usuario
        const sessionData = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
        const user = JSON.parse(sessionData) as SessionUser

        return user
    } catch (error) {
        console.error('Error getting session:', error)
        return null
    }
}

/**
 * Elimina la sesión del usuario
 */
export async function destroySession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
}
