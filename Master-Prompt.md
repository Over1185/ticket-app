## Sistema de Gestión de Tickets de Soporte - Arquitectura Completa

---

## CONTEXTO DEL PROYECTO

Estoy desarrollando un sistema completo de tickets de soporte con la siguiente arquitectura:

**Stack Tecnológico:**

- **Frontend + Backend:** Next.js 16 (App Router con Server Actions)
- **Base de Datos:** Turso (LibSQL/SQLite)
- **Caché y Colas:** Redis (Upstash)
- **Manejador de paquetes:** pnpm

**Objetivo:** Implementar una aplicación completa siguiendo principios de arquitectura de datos, seguridad, concurrencia, optimización y monitoreo.

---

## FASE 1: DISEÑO FÍSICO Y SEGURIDAD

### 1.1 Esquema de Base de Datos

Necesito que crees el schema completo para Turso/SQLite con las siguientes tablas:

#### Tabla: usuarios

```sql
-- Campos necesarios:
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- email (TEXT UNIQUE NOT NULL)
- nombre (TEXT NOT NULL)
- rol (TEXT CHECK: 'cliente', 'operador', 'admin')
- password_hash (TEXT NOT NULL)
- fecha_creacion (DATETIME DEFAULT CURRENT_TIMESTAMP)
- activo (BOOLEAN DEFAULT 1)

-- Restricciones:
- Email debe ser único y válido
- Rol debe ser uno de los valores permitidos
- Índice en email para búsquedas rápidas
```

#### Tabla: tickets

```sql
-- Campos necesarios:
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- titulo (TEXT NOT NULL)
- descripcion (TEXT NOT NULL)
- usuario_id (INTEGER NOT NULL REFERENCES usuarios(id))
- estado (TEXT CHECK: 'abierto', 'en_progreso', 'resuelto', 'cerrado')
- prioridad (TEXT CHECK: 'baja', 'media', 'alta', 'critica')
- categoria (TEXT)
- fecha_creacion (DATETIME DEFAULT CURRENT_TIMESTAMP)
- fecha_actualizacion (DATETIME DEFAULT CURRENT_TIMESTAMP)
- fecha_cierre (DATETIME NULL)
- asignado_a (INTEGER NULL REFERENCES usuarios(id))

-- Restricciones:
- Estado por defecto: 'abierto'
- Prioridad por defecto: 'media'
- Índices en: usuario_id, estado, fecha_creacion
```

#### Tabla: interacciones (tabla más grande - optimización crítica)

```sql
-- Campos necesarios:
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- ticket_id (INTEGER NOT NULL REFERENCES tickets(id))
- usuario_id (INTEGER NOT NULL REFERENCES usuarios(id))
- tipo (TEXT CHECK: 'comentario', 'cambio_estado', 'asignacion', 'cierre')
- contenido (TEXT)
- metadata (TEXT) -- JSON con información adicional
- fecha_creacion (DATETIME DEFAULT CURRENT_TIMESTAMP)
- es_interno (BOOLEAN DEFAULT 0) -- visible solo para operadores

-- ÍNDICE COMPUESTO CRÍTICO (optimización para consultas frecuentes):
CREATE INDEX idx_interacciones_ticket_fecha 
ON interacciones(ticket_id, fecha_creacion DESC);

-- Justificación del índice:
- Las consultas más frecuentes son: obtener todas las interacciones de un ticket ordenadas por fecha
- Este índice compuesto permite:
  1. Filtrado rápido por ticket_id (primera columna del índice)
  2. Ordenamiento eficiente por fecha sin sort adicional
  3. Cobertura para consultas tipo: SELECT * FROM interacciones WHERE ticket_id = ? ORDER BY fecha_creacion DESC
```

### 1.2 Archivo de Schema y Migrations

Crea la siguiente estructura:

```
/db
  /migrations
    - 001_initial_schema.sql
  - schema.sql (schema completo con comentarios de justificación)
  - seed.sql (datos de prueba: 5 usuarios, 20 tickets, 100 interacciones)
```

### 1.3 Simulación de Roles y Permisos

Como Turso/SQLite no tiene roles nativos, implementa un sistema de permisos basado en middleware:

```typescript
// /lib/auth/permissions.ts

// Definir roles y sus permisos
const ROLES = {
  'api_server': {
    description: 'Rol para el API Server (operaciones normales)',
    permissions: ['usuarios.select', 'usuarios.insert', 'usuarios.update',
                  'tickets.select', 'tickets.insert', 'tickets.update',
                  'interacciones.select', 'interacciones.insert', 'interacciones.update']
  },
  'batch_worker': {
    description: 'Rol para Batch Worker (tareas en background)',
    permissions: ['tickets.select', 'tickets.update',
                  'interacciones.select', 
                  'procedures.execute'] // permisos especiales
  },
  'admin': {
    description: 'Administrador con acceso completo',
    permissions: ['*']
  }
}

// Middleware para verificar permisos
function checkPermission(userRole: string, action: string): boolean {
  // Implementar lógica de verificación
}
```

**Documentación requerida:**
Crea un archivo `/docs/SECURITY.md` que explique:

- Cómo funciona el sistema de roles
- Equivalencia con CREATE ROLE, GRANT, DENY de SQL Server
- Ejemplo de uso en las rutas API

---

## FASE 2: INTEGRACIÓN Y CONCURRENCIA

### 2.1 Transacciones y Control de Concurrencia

Implementa Server Actions en Next.js con transacciones:

#### Server Action: Actualizar Estado y Registrar Interacción

```typescript
// /app/actions/tickets.ts

'use server'

export async function actualizarTicketConInteraccion(
  ticketId: number,
  nuevoEstado: string,
  comentario: string,
  usuarioId: number
) {
  // IMPLEMENTAR TRANSACCIÓN:
  // 1. BEGIN TRANSACTION
  // 2. UPDATE tickets SET estado = ?, fecha_actualizacion = ? WHERE id = ?
  // 3. INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, fecha_creacion)
  // 4. COMMIT si todo está bien
  // 5. ROLLBACK si hay error
  
  // Manejar niveles de aislamiento:
  // - Documentar diferencias entre READ COMMITTED y SERIALIZABLE
  // - Explicar problemas de concurrencia: dirty reads, lost updates, phantom reads
}
```

**Casos de Concurrencia a Documentar:**

Crea `/docs/CONCURRENCY.md` con:

1. Escenario: Usuario cambia estado mientras operador registra interacción
2. Problema de lectura sucia (dirty read)
3. Problema de actualización perdida (lost update)
4. Cómo las transacciones los mitigan
5. Código de ejemplo con y sin transacciones

### 2.2 Redis con Upstash - Caché y Colas

#### Configuración de Redis

```typescript
// /lib/redis/client.ts

import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Funciones de utilidad para caché
export async function cacheUser(userId: number, userData: any) {
  // SET user:{userId} {userData} EX 300 (TTL de 5 minutos)
  await redis.set(`user:${userId}`, JSON.stringify(userData), { ex: 300 })
}

export async function getCachedUser(userId: number) {
  // GET user:{userId}
  const cached = await redis.get(`user:${userId}`)
  return cached ? JSON.parse(cached as string) : null
}
```

#### Sistema de Colas para Batch Worker

```typescript
// /lib/redis/queue.ts

export async function enqueueTask(taskType: string, payload: any) {
  // RPUSH tasks:pending {task_json}
  await redis.rpush('tasks:pending', JSON.stringify({
    type: taskType,
    payload,
    timestamp: Date.now()
  }))
}

// Batch Worker (endpoint o cron job)
export async function processBatchTasks() {
  // LPOP tasks:pending
  const task = await redis.lpop('tasks:pending')
  if (task) {
    // Procesar tarea
    // Ejemplo: cerrar tickets inactivos, enviar notificaciones, etc.
  }
}
```

**Documentación de Redis:**
Crea `/docs/REDIS.md` con:

- Comandos utilizados: SET, GET, RPUSH, LPOP, TTL, INFO
- Métricas de keyspace y memoria: `INFO memory`, `INFO keyspace`
- Cómo Redis reduce la carga en Turso (explicación con ejemplos)
- Estrategia de invalidación de caché

---

## FASE 3: MONITOREO Y OPTIMIZACIÓN

### 3.1 Sistema de Métricas

Implementa endpoints de monitoreo:

```typescript
// /app/api/metrics/route.ts

export async function GET() {
  const metrics = {
    database: {
      // Métricas de Turso/SQLite
      total_queries: await getQueryCount(),
      avg_query_time: await getAvgQueryTime(),
      slow_queries: await getSlowQueries(), // > 100ms
      table_sizes: await getTableSizes(),
      index_usage: await getIndexUsage()
    },
    redis: {
      // Métricas de Redis
      used_memory: await redis.info('memory'),
      keyspace_hits: await redis.info('stats'),
      keyspace_misses: await redis.info('stats'),
      hit_rate: calculateHitRate(),
      connected_clients: await redis.info('clients'),
      queue_length: await redis.llen('tasks:pending')
    }
  }
  return Response.json(metrics)
}
```

### 3.2 Tabla de Métricas y Acciones de Tuning

Crea `/docs/METRICS.md` con una tabla:

| Componente | Métrica | Valor Óptimo | Valor Deficiente | Significado | Acción de Tuning |
|------------|---------|--------------|------------------|-------------|------------------|
| Turso | Tiempo promedio de query | < 50ms | > 200ms | Queries lentas afectan UX | 1. Analizar queries con EXPLAIN<br>2. Agregar índices faltantes<br>3. Revisar N+1 queries |
| Turso | Uso de índices | > 80% | < 50% | Índices no se usan | 1. ANALYZE para actualizar estadísticas<br>2. Revisar queries sin índices<br>3. Crear índices compuestos |
| Turso | Tamaño tabla interacciones | Variable | > 10GB | Tabla muy grande | 1. Implementar archivado<br>2. Particionar por fecha<br>3. Comprimir datos antiguos |
| Redis | Hit Rate | > 90% | < 70% | Caché ineficiente | 1. Aumentar TTL para datos estables<br>2. Implementar cache warming<br>3. Revisar patrones de acceso |
| Redis | Memoria usada | < 80% | > 90% | Riesgo de eviction | 1. Implementar LRU policy<br>2. Reducir TTL de keys<br>3. Limpiar keys obsoletas |
| Redis | Queue length | < 100 | > 1000 | Batch Worker lento | 1. Aumentar workers<br>2. Optimizar procesamiento<br>3. Implementar prioridades |

---

## ESTRUCTURA DE ARCHIVOS REQUERIDA

```
/app
  /actions
    - tickets.ts (server actions con transacciones)
    - users.ts
  /api
    /tickets
      - route.ts
    /metrics
      - route.ts
    /batch
      - route.ts
  /(dashboard)
    /tickets
      - page.tsx (lista de tickets)
      /[id]
        - page.tsx (detalle de ticket)
  /(auth)
    /login
      - page.tsx

/lib
  /db
    - client.ts (conexión a Turso)
    - queries.ts (funciones de queries optimizadas)
  /redis
    - client.ts
    - cache.ts
    - queue.ts
  /auth
    - permissions.ts
    - session.ts

/db
  /migrations
    - 001_initial_schema.sql
  - schema.sql
  - seed.sql

/docs
  - ARCHITECTURE.md (diagrama y explicación)
  - SECURITY.md (roles y permisos)
  - CONCURRENCY.md (transacciones y problemas)
  - REDIS.md (estrategia de caché y colas)
  - METRICS.md (tabla de métricas y tuning)
  - BACKUP.md (estrategia de respaldo)

/components
  - ticket-form.tsx
  - ticket-list.tsx
  - interaction-timeline.tsx
```

---

## ESTRATEGIA DE RECUPERACIÓN (BACKUP)

**Nota:** Turso tiene backup automático, pero documenta una estrategia equivalente:

Crea `/docs/BACKUP.md` con:

1. **Respaldo Completo (Full Backup)**
   - Frecuencia: Diario a las 2:00 AM
   - Comando: `turso db dump` o exportación SQLite
   - Retención: 7 días

2. **Respaldo Incremental/Diferencial**
   - Turso maneja esto con su sistema de replicación
   - Alternativa: Exportar cambios cada hora
   - Retención: 24 horas

3. **Logs Transaccionales**
   - Turso mantiene WAL (Write-Ahead Log)
   - Permite Point-in-Time Recovery (PITR)
   - Pérdida máxima aceptable: 15 minutos

4. **Tareas de Mantenimiento**
   - Reconstrucción de índices: `REINDEX` mensual
   - Verificación de integridad: `PRAGMA integrity_check` semanal
   - Actualización de estadísticas: `ANALYZE` diario
   - Limpieza de espacio: `VACUUM` semanal

5. **Procedimiento de Recuperación Puntual**

   ```bash
   # Recuperar a timestamp específico
   turso db restore --timestamp "2024-01-15T10:30:00Z"
   
   # O desde backup específico
   turso db restore --from-backup backup-20240115
   ```

---

## ENTREGABLES FINALES

Al terminar, debe generar:

1. **Scripts SQL completos** (`/db/`)
2. **Código funcional de Next.js 16** con Server Actions
3. **Integración completa con Redis** (caché + colas)
4. **Sistema de métricas funcional** (`/app/api/metrics`)
5. **Documentación técnica** (`/docs/`) con todas las explicaciones requeridas
6. **Dashboard de métricas** (opcional: componente React para visualizar)

---

## INSTRUCCIONES ESPECIALES PARA COPILOT

- Usa **TypeScript estricto** en todo el proyecto
- Implementa **Server Actions de Next.js 16** para mutaciones
- Usa **Turso SDK** (@libsql/client) para la base de datos
- Usa **Upstash Redis SDK** (@upstash/redis)
- Implementa **manejo de errores robusto** con try-catch y validaciones
- Agrega **comentarios explicativos** en código complejo
- Sigue **mejores prácticas de seguridad**: validación de inputs, sanitización, prepared statements
- Usa **Zod** para validación de esquemas
- Implementa **loading states y error boundaries** en UI

---

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. **Setup inicial:** Configurar Turso y Redis
2. **Schema:** Crear tablas y seed data
3. **Queries básicas:** CRUD de usuarios, tickets, interacciones
4. **Transacciones:** Implementar server actions con transacciones
5. **Redis:** Caché de usuarios y sistema de colas
6. **UI básica:** Formularios y listas
7. **Métricas:** Endpoints de monitoreo
8. **Documentación:** Completar todos los archivos en `/docs`
9. **Optimización:** Revisar queries lentas, agregar índices si necesario
10. **Testing:** Probar concurrencia y transacciones

---

**¡COMIENZA LA IMPLEMENTACIÓN! Genera primero el schema de base de datos con todas las justificaciones.**
