# Redis - Caché y Sistema de Colas

## Estrategia de Caché

### 1. Cache-Aside Pattern

```
┌─────────────┐
│    Usuario  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  ¿Está en Redis? │──YES──┐
└────────┬─────────┘       │
        NO                 ▼
         │          Retornar del caché
         │                 │
         ▼                 │
    ┌─────────┐           │
    │ Turso   │           │
    └────┬────┘           │
         │                │
         ▼                ▼
    ┌────────────────────────┐
    │  Guardar en caché      │
    │  SET user:N "data"    │
    │  EX 300 (5 min)       │
    └────────────────────────┘
         │
         ▼
    Retornar usuario
```

### 2. Claves en Redis

```
user:{userId}              # Datos de usuario
ticket:{ticketId}          # Datos de ticket
tasks:pending              # Cola de tareas pendientes
session:{sessionId}        # Datos de sesión (opcional)
```

### 3. Operaciones de Caché

```typescript
// src/lib/redis/cache.ts

// GUARDAR EN CACHÉ
export async function cacheUser(userId: number, userData: any) {
  await redis.set(`user:${userId}`, JSON.stringify(userData), {
    ex: 300  // TTL: 5 minutos
  })
}

// OBTENER DE CACHÉ
export async function getCachedUser(userId: number) {
  const cached = await redis.get(`user:${userId}`)
  return cached ? JSON.parse(cached as string) : null
}

// INVALIDAR CACHÉ
export async function invalidateUserCache(userId: number) {
  await redis.del(`user:${userId}`)
}
```

### Flujo Real de Obtención de Ticket

```typescript
export async function obtenerTicket(ticketId: number) {
  // 1. Intentar caché
  const cached = await getCachedTicket(ticketId)
  if (cached) {
    console.log('Cache HIT')
    return { success: true, ticket: cached }
  }
  
  // 2. Cache MISS, consultar BD
  console.log('Cache MISS')
  const ticket = await queries.obtenerTicket(ticketId)
  
  // 3. Guardar en caché para próxima vez
  if (ticket) {
    await cacheTicket(ticketId, ticket)
  }
  
  return { success: true, ticket }
}
```

### Métricas de Caché

```
Hit Rate = Hits / (Hits + Misses)

Óptimo: > 80%
Deficiente: < 50%

Si hit rate bajo:
- Aumentar TTL para datos estables
- Implementar "cache warming"
- Revisar patrones de acceso
```

## Sistema de Colas (Task Queue)

### Propósito

Desacoplar operaciones largas del request principal:

```
HTTP Request           Task Processing
──────────┐           ────────────────
│          │
├─ 1. Crear cambio     
├─ 2. Enqueue tarea    
└─ 3. Retornar        
     (rápido: 50ms)    

                       Worker:
                       ├─ Dequeue
                       ├─ Procesar
                       ├─ Completar
                       └─ Log
                       (async: 2-5s)
```

### Implementación

```typescript
// src/lib/redis/queue.ts

export interface Task {
  type: 'close_inactive_tickets' | 'send_notifications' | 'archive_old_interactions'
  payload: any
  timestamp: number
}

// Enqueuer (en acción de usuario)
export async function enqueueTask(task: Omit<Task, 'timestamp'>) {
  await redis.rpush(
    'tasks:pending',
    JSON.stringify({
      ...task,
      timestamp: Date.now()
    } as Task)
  )
}

// Dequeuer (en worker)
export async function dequeueTask(): Promise<Task | null> {
  const taskJson = await redis.lpop('tasks:pending')
  return taskJson ? JSON.parse(taskJson as string) : null
}
```

### Ejemplo: Cerrar Tickets Inactivos

```typescript
// Server Action: Crear un ticket (rápido)
export async function crearTicket(datos: unknown) {
  // ... validar, crear en BD ...
  
  // Enqueue tarea para notificación
  await enqueueTask({
    type: 'send_notifications',
    payload: {
      ticketId: newTicketId,
      usuarioId: datos.usuarioId,
      tipo: 'ticket_creado'
    }
  })
  
  return { success: true, ticketId }
}

// Batch Worker: Procesar tareas (en background)
export async function procesarTareas() {
  let processed = 0
  
  while (true) {
    const task = await dequeueTask()
    if (!task) break
    
    switch (task.type) {
      case 'send_notifications':
        await enviarNotificacion(task.payload)
        break
      case 'close_inactive_tickets':
        await cerrarTicketsInactivos(task.payload)
        break
      case 'archive_old_interactions':
        await archivarInteraccionesAntiguas(task.payload)
        break
    }
    
    processed++
  }
  
  return { processed }
}
```

## Monitoreo de Redis

### Comandos INFO

```bash
# Información de memoria
REDIS> INFO memory

# used_memory: 2GB
# peak_memory: 2.5GB
# memory_utilization: 75%

# Keyspace
REDIS> INFO keyspace

# db0:keys=50,expires=10,avg_ttl=280000
```

### Implementación en Endpoint

```typescript
// src/app/api/metrics/route.ts

export async function GET(request: NextRequest) {
  const metrics = {
    redis: {
      // Número de keys
      keys: await redis.dbsize(),
      
      // Longitud de cola
      queue_length: await redis.llen('tasks:pending'),
      
      // Información (aproximada en Upstash)
      memory: {
        used_bytes: 0,
        max_bytes: 0,
        used_percent: 0
      }
    }
  }
  
  return NextResponse.json(metrics)
}
```

## Tabla de Métricas y Tuning

| Métrica | Óptimo | Deficiente | Significado | Acción |
|---------|--------|-----------|-------------|--------|
| Cache Hit Rate | > 90% | < 50% | Efectividad del caché | Aumentar TTL, cache warming |
| Memory Used | < 80% | > 95% | Presión de memoria | Reducir TTL, limpiar keys obsoletas |
| Queue Length | < 100 | > 1000 | Backlog de tareas | Aumentar workers, optimizar procesamiento |
| TTL Promedio | 300s | < 60s | Duración en caché | Aumentar TTL para datos estables |
| Key Evictions | 0 | > 100/min | Keys eliminadas por límite | Aumentar memoria o reducir TTL |

## Estrategia de Invalidación

### 1. Invalidación Inmediata

```typescript
export async function actualizarTicket(id: number, ...) {
  // Actualizar en BD
  await updateTicket(id, ...)
  
  // Invalidar caché inmediatamente
  await invalidateTicketCache(id)
  
  // Siguiente lectura irá a BD y recacheará
}
```

### 2. Invalidación Selectiva

```typescript
// Invalidar solo el ticket específico, no todos
await invalidateTicketCache(ticketId)

// NO: Invalidar todo (más lento)
await redis.flushdb()
```

### 3. Cache Warming (Precarga)

```typescript
// Al iniciar app, precargar datos frecuentes
export async function warmupCache() {
  const usuariosActivos = await listarUsuarios()
  
  for (const usuario of usuariosActivos) {
    await cacheUser(usuario.id, usuario)
  }
  
  console.log(`Cache precargado: ${usuariosActivos.length} usuarios`)
}
```

## Comparativa: Con vs Sin Redis

| Operación | Sin Redis | Con Redis | Mejora |
|-----------|-----------|-----------|--------|
| Obtener usuario (hit) | 50ms (BD) | 5ms (caché) | **10x más rápido** |
| Listar 100 tickets | 200ms (BD) | 40ms (caché) | **5x más rápido** |
| Crear comentario | 150ms (BD) | 100ms (BD + queue) | Asincrón |
| Peak load (1000 req/s) | Turso abrumado | Distribuido | **Escalable** |

## Configuración de Upstash

```env
# .env
UPSTASH_REDIS_REST_URL=https://meet-lionfish-18721.upstash.io
UPSTASH_REDIS_REST_TOKEN=AUkhAAIncDE1NjAxNzY1Nzc2ZDA0MWI5YmZkOWZmOGJhZDBiZDFlOXAxMTg3MjE

# Crear conexión
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
```

## Próximos Pasos

1. **Sentinel/Replication:** Alta disponibilidad
2. **PubSub:** Notificaciones en tiempo real
3. **Lua Scripts:** Operaciones atómicas complejas
4. **Streams:** Event sourcing
5. **Cluster:** Escalado horizontal
