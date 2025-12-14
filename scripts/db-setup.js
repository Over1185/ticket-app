import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";

const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
    console.error("TURSO_DATABASE_URL y TURSO_AUTH_TOKEN son requeridos en .env");
    process.exit(1);
}

const db = createClient({ url, authToken });

function loadSql(file) {
    const sqlPath = path.join(process.cwd(), "db", file);
    if (!fs.existsSync(sqlPath)) {
        throw new Error(`No se encontró ${sqlPath}`);
    }
    return fs.readFileSync(sqlPath, "utf8");
}

async function main() {
    const schema = loadSql("schema.sql");
    const seed = loadSql("seed.sql");

    console.log("Aplicando schema...");
    await db.executeMultiple(schema);
    console.log("Aplicando seed...");
    await db.executeMultiple(seed);
    console.log("Listo");
}

main().catch((err) => {
    console.error("Error cargando base de datos", err);
    process.exit(1);
});
