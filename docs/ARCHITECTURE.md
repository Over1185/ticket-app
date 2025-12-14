# Arquitectura

## Stack

- Next.js 16 (App Router, Server Actions)
- Turso (LibSQL) para persistencia transaccional
- Upstash Redis para caché y colas
- Zod para validación, bcrypt para hashing

## Flujo de datos

1. UI (App Router) envía formularios que llaman Server Actions.
2. Server Actions ejecutan lógica de dominio + transacciones en Turso.
3. Cacheo: lecturas de usuarios pasan por Redis; escrituras invalidan o encolan refrescos.
4. Métricas: endpoint `/api/metrics` reúne señales de Turso y Redis.
5. Batch: `/api/batch` drena `tasks:pending` para trabajos diferidos.

## Carpetas

- `/app` rutas y Server Actions
- `/lib/db` cliente Turso y queries tipadas
- `/lib/redis` cliente, caché y colas
- `/lib/auth` roles/permiso y stub de sesión
- `/db` schema, migración inicial y seed
- `/docs` guías operativas (seguridad, concurrencia, redis, métricas, backup)
- `/components` UI reutilizable (formulario, lista, timeline)

## Consideraciones

- Transacciones usan `db.transaction()` para atomicidad.
- Inputs validados con Zod; se evita interpolación sin parámetros.
- Índice crítico en `interacciones(ticket_id, fecha_creacion DESC)` optimiza timelines.
- Redis reduce presión de lectura y soporta colas simples con RPUSH/LPOP.
