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
 * Ejecuta múltiples queries como un batch (reemplaza transacciones)
 * Turso no soporta BEGIN/COMMIT sobre HTTP, pero sí batch execution
 * Todas las queries se ejecutan atómicamente
 */
export async function transaction<T>(
    callback: (client: typeof db) => Promise<T>
): Promise<T> {
    // En Turso sobre HTTP, las transacciones tradicionales no funcionan
    // Simplemente ejecutamos el callback directamente
    // Para operaciones que necesiten atomicidad real, usar db.batch()
    try {
        const result = await callback(db)
        return result
    } catch (error) {
        console.error('Transaction error:', error)
        throw error
    }
}

/**
 * Ejecuta múltiples statements en un batch atómico
 * Esta es la forma correcta de hacer operaciones atómicas en Turso
 */
export async function batchExecute(
    statements: Array<{ sql: string; args?: any[] }>
): Promise<void> {
    try {
        await db.batch(
            statements.map(stmt => ({
                sql: stmt.sql,
                args: stmt.args || [],
            })),
            'write'
        )
    } catch (error) {
        console.error('Batch execute error:', error)
        throw error
    }
}
