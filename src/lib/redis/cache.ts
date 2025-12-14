import { redis } from "./client";

export async function cacheUser(userId: number, userData: unknown) {
    await redis.set(`user:${userId}`, JSON.stringify(userData), { ex: 300 });
}

export async function getCachedUser<T = unknown>(userId: number): Promise<T | null> {
    const cached = await redis.get(`user:${userId}`);
    return cached ? (JSON.parse(cached as string) as T) : null;
}

export async function invalidateUserCache(userId: number) {
    await redis.del(`user:${userId}`);
}
