# Métricas y Monitoreo

## Dashboard de Métricas

**Endpoint:** `GET /api/metrics`

```json
{
  "database": {
    "status": "online",
    "tables": {
      "usuarios": 5,
      "tickets": 42,
      "interacciones": 237
    }
  },
  "redis": {
    "status": "online",
    "memory": {
      "used_bytes": 1048576,
      "max_bytes": 10737418240,
      "used_percent": 9.77
    },
    "keyspace": {
      "keys": 23,
      "hits": 450,
      "misses": 50,
      "hit_rate": 90
    },
    "queue": {
      "pending_tasks": 5
    }
  },
  "timestamp": "2024-12-14T15:30:00Z"
}
```

## Tabla de Métricas Críticas

| Componente | Métrica | Óptimo | Deficiente | Significado | Acción de Tuning |
|------------|---------|--------|-----------|-------------|------------------|
| **Turso** | Tiempo promedio query | < 50ms | > 200ms | Queries lentas afectan UX | 1. EXPLAIN QUERY PLAN<br>2. Analizar índices<br>3. Agregar índices faltantes<br>4. Revisar N+1 queries |
| **Turso** | Uso de índices | > 80% | < 50% | Índices no se usan | 1. ANALYZE para actualizar estadísticas<br>2. Revisar queries sin índices<br>3. Crear índices compuestos<br>4. Revisar selectividad |
| **Turso** | Tamaño tabla interacciones | < 5GB | > 10GB | Tabla muy grande | 1. Implementar archivado<br>2. Particionar por fecha<br>3. Comprimir datos antiguos<br>4. Limpiar duplicados |
| **Turso** | Fragmentación BD | < 5% | > 20% | Ineficiencia de almacenamiento | 1. Ejecutar VACUUM<br>2. Reconstruir índices<br>3. Optimizar storage |
| **Redis** | Hit Rate | > 90% | < 70% | Caché ineficiente | 1. Aumentar TTL para datos estables<br>2. Implementar cache warming<br>3. Revisar patrones de acceso<br>4. Monitorear evictions |
| **Redis** | Memoria usada | < 80% | > 90% | Riesgo de eviction | 1. Implementar LRU policy<br>2. Reducir TTL de keys<br>3. Limpiar keys obsoletas<br>4. Escalar memoria |
| **Redis** | Queue length | < 100 | > 1000 | Batch Worker lento | 1. Aumentar workers<br>2. Optimizar procesamiento<br>3. Implementar prioridades<br>4. Escalar recursos |
| **Redis** | Key Evictions | 0 | > 100/min | Keys eliminadas por presión | 1. Aumentar memoria<br>2. Reducir TTL<br>3. Implementar LRU<br>4. Investigar fugas |
| **API** | Latencia p95 | < 200ms | > 1s | Respuesta lenta | 1. Cachear más datos<br>2. Optimizar queries<br>3. Implementar CDN<br>4. Escalar horizontalmente |
| **API** | Tasa de errores | < 0.1% | > 1% | Muchas fallas | 1. Revisar logs de error<br>2. Aumentar timeout<br>3. Implementar retry logic<br>4. Escalar recursos |
| **BD** | Conexiones activas | < 80% | > 95% | Agotamiento de conexiones | 1. Implementar connection pooling<br>2. Revisar leaks de conexión<br>3. Aumentar límite de conexiones<br>4. Escalar BD |
| **BD** | Locks | < 10 | > 100 | Deadlocks frecuentes | 1. Revisar transacciones largas<br>2. Implementar timeouts<br>3. Optimizar orden de locks<br>4. Agregar índices |

## Queries para Análisis

### 1. Análisis de Tamaño de Tablas

```sql
-- Tamaño estimado en SQLite
SELECT 
  name as 'Tabla',
  (SELECT COUNT(*) FROM usuarios) as 'Filas Usuarios',
  (SELECT COUNT(*) FROM tickets) as 'Filas Tickets',
  (SELECT COUNT(*) FROM interacciones) as 'Filas Interacciones'
FROM sqlite_master 
WHERE type='table';
```

### 2. Análisis de Índices

```sql
-- Verificar índices creados
SELECT name, sql FROM sqlite_master 
WHERE type='index' 
ORDER BY name;

-- Estadísticas de índices
SELECT 
  'tickets' as tabla,
  COUNT(*) as filas,
  ROUND(CAST((SELECT page_count FROM pragma_page_count) * 4096 
    AS FLOAT) / 1024 / 1024, 2) as tamaño_mb
FROM tickets;
```

### 3. Queries Lentas

```sql
-- Simular EXPLAIN para ver planes
EXPLAIN QUERY PLAN 
SELECT * FROM interacciones 
WHERE ticket_id = 5 
ORDER BY fecha_creacion DESC;

-- Deseado: SEARCH interacciones USING idx_interacciones_ticket_fecha
-- No deseado: SCAN TABLE interacciones (sin índice)
```

### 4. Conteo de Interacciones por Ticket

```sql
SELECT 
  ticket_id,
  COUNT(*) as total_interacciones,
  AVG(LENGTH(contenido)) as longitud_promedio
FROM interacciones
GROUP BY ticket_id
ORDER BY total_interacciones DESC
LIMIT 10;
```

## Monitoreo en Producción

### Stack Recomendado

```
┌─────────────────┐
│  Application    │
│  (Next.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Metrics        │
│  Export         │
│  (Prometheus)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Visualization  │
│  (Grafana)      │
└─────────────────┘
```

### Métrica Custom en Next.js

```typescript
// lib/metrics/collector.ts

export interface Metrics {
  requests: {
    total: number
    errors: number
    latency_ms: number
  }
  database: {
    queries: number
    slow_queries: number
    avg_time_ms: number
  }
  redis: {
    hits: number
    misses: number
    hit_rate: number
  }
}

let metrics: Metrics = {
  requests: { total: 0, errors: 0, latency_ms: 0 },
  database: { queries: 0, slow_queries: 0, avg_time_ms: 0 },
  redis: { hits: 0, misses: 0, hit_rate: 0 }
}

export function recordRequest(latency: number, error?: boolean) {
  metrics.requests.total++
  metrics.requests.latency_ms = latency
  if (error) metrics.requests.errors++
}

export function recordQuery(time: number) {
  metrics.database.queries++
  metrics.database.avg_time_ms = time
  if (time > 100) metrics.database.slow_queries++
}

export function recordCacheHit(hit: boolean) {
  if (hit) {
    metrics.redis.hits++
  } else {
    metrics.redis.misses++
  }
  const total = metrics.redis.hits + metrics.redis.misses
  metrics.redis.hit_rate = total > 0 ? 
    Math.round((metrics.redis.hits / total) * 100) : 0
}

export function getMetrics() {
  return metrics
}
```

### Middleware para Latencia

```typescript
// middleware.ts

import { recordRequest } from '@/lib/metrics/collector'

export function middleware(request: NextRequest) {
  const start = Date.now()
  
  return NextResponse.next().then((response) => {
    const latency = Date.now() - start
    const isError = response.status >= 400
    
    recordRequest(latency, isError)
    
    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`${request.nextUrl.pathname} - ${latency}ms`)
    }
    
    return response
  })
}
```

## Alertas Recomendadas

### 1. Alerta: Alta Latencia

```
IF latency_p95 > 500ms FOR 5 minutes
THEN send_alert("API latency crítica")
```

### 2. Alerta: Tasa de Error Alta

```
IF error_rate > 1% FOR 1 minute
THEN send_alert("Tasa de errores elevada")
```

### 3. Alerta: Redis Memory Pressure

```
IF redis_memory_used > 90% OF max
THEN send_alert("Redis memory critica")
```

### 4. Alerta: Queue Backlog

```
IF queue_length > 1000 FOR 10 minutes
THEN send_alert("Batch worker atrasado")
```

## Performance Profiling

### Identificar N+1 Queries

```typescript
// BAD: N+1
const tickets = await listarTickets()
for (const ticket of tickets) {
  const usuario = await obtenerUsuario(ticket.usuario_id) // N queries!
}

// GOOD: Usar JOIN
const tickets = await query(`
  SELECT t.*, u.nombre, u.email
  FROM tickets t
  JOIN usuarios u ON t.usuario_id = u.id
`)
```

### Benchmark de Operaciones

```typescript
async function benchmarkOperacion(nombre: string, fn: () => Promise<any>) {
  const start = performance.now()
  const resultado = await fn()
  const tiempo = performance.now() - start
  
  console.log(`${nombre}: ${tiempo.toFixed(2)}ms`)
  return { tiempo, resultado }
}

// Uso
await benchmarkOperacion('Obtener usuario', () => 
  obtenerUsuario(1)
)

// Output: Obtener usuario: 23.45ms
```

## Tablero de Control Sugerido

```
┌─────────────────────────────────────────────────┐
│      SYSTEM METRICS DASHBOARD                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Latencia API       Redis Memory      DB Size  │
│  [||||||||    ]   [||||||||||  ]   [|||    ]   │
│   45ms  (<200ms)    75%  (<80%)      2.3GB     │
│                                                 │
│  Cache Hit Rate    Queue Length   Requests/s  │
│  [||||||||||||  ]  [|     ]         [||||  ]   │
│    92%  (>90%)        12            1250/s     │
│                                                 │
│  Errores (1h)      Slowqueries     Uptime     │
│  12 (0.01%)        5 (>100ms)      99.99%     │
│                                                 │
│  TOP 5 QUERIES LENTOS:                        │
│  1. SELECT ... FROM interacciones ... (234ms) │
│  2. SELECT ... FROM tickets ... (189ms)       │
│  3. SELECT ... FROM usuarios ... (156ms)      │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Checklist de Monitoreo

- [x] Endpoint `/api/metrics` implementado
- [x] Conteos de tablas disponibles
- [x] Información de Redis disponible
- [ ] Dashboard Grafana configurado
- [ ] Alertas configuradas
- [ ] Logs centralizados
- [ ] APM (Application Performance Monitoring)
- [ ] Tracing distribuido
- [ ] Alertas en PagerDuty/Slack
- [ ] SLO/SLI definidos
