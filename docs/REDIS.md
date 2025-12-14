# Redis (Upstash)

## Comandos usados

- `SET key value EX 300` cache de usuario 5 minutos.
- `GET key` lectura de cache.
- `DEL key` invalidación.
- `RPUSH tasks:pending payload` encola tareas.
- `LPOP tasks:pending` consume tareas.
- `LLEN tasks:pending` tamaño de cola.
- `INFO memory|stats|clients` métricas operativas.

## Estrategia de caché

- Key: `user:{id}` con TTL 300s.
- Al escribir usuario/ticket relevante, encolamos `refresh_ticket_cache` o invalidamos key directamente.
- Hit rate esperado > 90%; si baja, aumentar TTL para datos poco cambiantes.

## Cómo reduce carga en Turso

- Lecturas frecuentes de usuario (nombre/rol) se sirven desde Redis.
- Listas ligeras (ej. último ticket abierto) se pueden cachear a corto plazo.
- Métricas (`INFO`) permiten dimensionar antes de que la base de datos sufra.

## Métricas de keyspace/memoria

- `INFO memory`: `used_memory`, `maxmemory` (si aplica).
- `INFO stats`: `keyspace_hits`, `keyspace_misses` → tasa de aciertos = hits / (hits + misses).
- `INFO keyspace`: distribución de keys por DB.

## Invalidación

- Al actualizar entidades que afectan cachear usuario/ticket, llamar `invalidateUserCache` o publicar una tarea de refresco.
- Para colas, usar expiración en payloads si es necesario para evitar trabajos stale.
