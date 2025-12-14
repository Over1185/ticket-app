import { NextResponse } from "next/server";
import { redis } from "@/lib/redis/client";
import {
    getAvgQueryTime,
    getIndexUsage,
    getQueryCount,
    getSlowQueries,
    getTableSizes,
} from "@/lib/db/metrics";

function parseInfo(raw: string) {
    const lines = raw.split("\n");
    const data: Record<string, string> = {};
    for (const line of lines) {
        if (line.includes(":")) {
            const [key, value] = line.split(":");
            data[key.trim()] = value.trim();
        }
    }
    return data;
}

function calculateHitRate(stats: Record<string, string>) {
    const hits = Number(stats["keyspace_hits"] ?? 0);
    const misses = Number(stats["keyspace_misses"] ?? 0);
    const total = hits + misses;
    if (total === 0) return 0;
    return hits / total;
}

export async function GET() {
    const [memoryRaw, statsRaw, clientsRaw, queueLength] = await Promise.all([
        redis.info("memory"),
        redis.info("stats"),
        redis.info("clients"),
        redis.llen("tasks:pending"),
    ]);

    const memory = parseInfo(memoryRaw as string);
    const stats = parseInfo(statsRaw as string);
    const clients = parseInfo(clientsRaw as string);

    const metrics = {
        database: {
            total_queries: await getQueryCount(),
            avg_query_time: await getAvgQueryTime(),
            slow_queries: await getSlowQueries(),
            table_sizes: await getTableSizes(),
            index_usage: await getIndexUsage(),
        },
        redis: {
            used_memory: memory["used_memory"],
            keyspace_hits: stats["keyspace_hits"],
            keyspace_misses: stats["keyspace_misses"],
            hit_rate: calculateHitRate(stats),
            connected_clients: clients["connected_clients"],
            queue_length: queueLength,
        },
    };

    return NextResponse.json(metrics);
}
