import { createClient } from '@libsql/client'

const databaseUrl = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!databaseUrl || !authToken) {
    throw new Error('Missing Turso database credentials')
}

export const db = createClient({
    url: databaseUrl,
    authToken: authToken,
})

/**
 * Ejecuta una query con parámetros
 * Útil para prevenir SQL injection
 */
export async function query<T = any>(
    sql: string,
    params: any[] = []
): Promise<T[]> {
    try {
        const result = await db.execute({
            sql,
            args: params,
        })
        return (result.rows as T[]) || []
    } catch (error) {
        console.error('Database query error:', error)
        throw error
    }
}

/**
 * Ejecuta una query que retorna una sola fila
 */
export async function queryOne<T = any>(
    sql: string,
    params: any[] = []
): Promise<T | null> {
    const results = await query<T>(sql, params)
    return results.length > 0 ? results[0] : null
}

/**
 * Ejecuta una query sin retornar datos (INSERT, UPDATE, DELETE)
 */
export async function execute(
    sql: string,
    params: any[] = []
): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
    try {
        const result = await db.execute({
            sql,
            args: params,
        })
        return {
            changes: result.rows.length,
            lastInsertRowid: result.lastInsertRowid || 0,
        }
    } catch (error) {
        console.error('Database execute error:', error)
        throw error
    }
}

/**
 * Ejecuta múltiples queries en una transacción
 * Si alguna falla, hace rollback de todas
 */
export async function transaction<T>(
    callback: (client: typeof db) => Promise<T>
): Promise<T> {
    try {
        await db.execute('BEGIN TRANSACTION')
        const result = await callback(db)
        await db.execute('COMMIT')
        return result
    } catch (error) {
        await db.execute('ROLLBACK').catch(() => {
            // Ignorar errores en rollback
        })
        console.error('Transaction error:', error)
        throw error
    }
}
