import { db } from "./client";

export type TableSize = {
    name: string;
    estimated_rows: number;
    estimated_bytes: number | null;
};

export async function getQueryCount(): Promise<number | null> {
    // SQLite no expone contador de queries por defecto; se retorna null para indicar no disponible.
    return null;
}

export async function getAvgQueryTime(): Promise<number | null> {
    return null;
}

export async function getSlowQueries(thresholdMs = 100): Promise<string[]> {
    // Sin profiler embebido; se sugiere instrumentar a nivel de aplicación.
    return [];
}

export async function getTableSizes(): Promise<TableSize[]> {
    const tablesResult = await db.execute({
        sql: "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    });

    const sizes: TableSize[] = [];
    for (const row of tablesResult.rows) {
        const name = String(row.name);
        const countResult = await db.execute({ sql: `SELECT COUNT(*) as c FROM ${name}` });
        const estimated_rows = Number(countResult.rows[0].c ?? 0);

        let estimated_bytes: number | null = null;
        try {
            const stat = await db.execute({ sql: "SELECT sum(pgsize) AS bytes FROM dbstat WHERE name = ?", args: [name] });
            estimated_bytes = stat.rows[0]?.bytes ? Number(stat.rows[0].bytes) : null;
        } catch {
            estimated_bytes = null;
        }

        sizes.push({ name, estimated_rows, estimated_bytes });
    }
    return sizes;
}

export async function getIndexUsage() {
    const result = await db.execute({
        sql: "SELECT name, tbl_name as table_name FROM sqlite_schema WHERE type = 'index' AND name NOT LIKE 'sqlite_%'",
    });
    return result.rows.map((r) => ({ name: String(r.name), table: String(r.table_name) }));
}
