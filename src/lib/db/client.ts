import { createClient, type Client } from "@libsql/client";

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
    throw new Error("TURSO_DATABASE_URL is not defined in environment");
}

if (!dbToken) {
    throw new Error("TURSO_AUTH_TOKEN is not defined in environment");
}

// Reuse client in dev to avoid exhausting connections on hot reloads
let client: Client;

declare const globalThis: {
    _tursoClient?: Client;
} & typeof global;

if (globalThis._tursoClient) {
    client = globalThis._tursoClient;
} else {
    client = createClient({ url: dbUrl, authToken: dbToken });
    if (process.env.NODE_ENV !== "production") {
        globalThis._tursoClient = client;
    }
}

export const db = client;
