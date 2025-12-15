# Arquitectura del Sistema de Gestión de Tickets

## Diagrama General

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO / NAVEGADOR                      │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Next.js 16    │
                    │  (Frontend +    │
                    │   Backend)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
         │  Turso  │   │  Redis  │   │   API   │
         │ (SQLite)│   │ (Cache) │   │(Metrics)│
         └─────────┘   └─────────┘   └────────┘
```

## Componentes Principales

### 1. Frontend & Backend (Next.js 16)

**Característica:** Monolítico con App Router

- **Pages:** Renderizado del lado del cliente
- **Server Actions:** Llamadas seguras del servidor para mutaciones
- **API Routes:** Endpoints REST para operaciones de batch y métricas

**Ventajas:**

- Menor complejidad que microservicios
- Mejor rendimiento (sin latencia de red)
- Seguridad: Server Actions no exponen endpoint URLs

### 2. Base de Datos (Turso/SQLite)

**Características:**

- Repositorio principal de datos
- Transacciones ACID completas
- Índices optimizados para consultas frecuentes
- 3 tablas principales: `usuarios`, `tickets`, `interacciones`

**Optimización:**

- Índice compuesto en `interacciones(ticket_id, fecha_creacion DESC)` para timelines
- Índices en campos de búsqueda frecuentes (email, estado, usuario_id)

### 3. Caché (Upstash Redis)

**Uso:**

- **Cache-aside:** Almacena usuarios y tickets para reducir carga en Turso
- **Invalidación:** Se limpia al actualizar datos
- **TTL:** 5 minutos por defecto

**Beneficio:**

- Reduce latencia de búsquedas frecuentes
- Disminuye carga en base de datos
- Mejora experiencia del usuario

### 4. Colas de Tareas (Redis LPUSH/LPOP)

**Propósito:**

- Sistema asincrónico para tareas en background
- Desacopla operaciones de larga duración

**Ejemplos de tareas:**

- Cerrar tickets inactivos
- Enviar notificaciones
- Archivar interacciones antiguas

### 5. Sistema de Métricas

**Endpoints:**

- `GET /api/metrics` - Estado del sistema
- `POST /api/batch` - Procesa colas pendientes

**Métricas recopiladas:**

- Conteo de tablas
- Tamaño de colas de Redis
- Información de conexiones

## Flujo de Datos

### Creación de Ticket

```
Usuario → form → Server Action crearTicket()
  ↓
validates con Zod
  ↓
ejecuta INSERT en Turso
  ↓
cachea resultado en Redis
  ↓
retorna ticketId
  ↓
UI actualiza (redirige a detalle)
```

### Actualización de Ticket + Interacción (Transacción)

```
Usuario → cambia estado + comentario
  ↓
Server Action actualizarTicketConInteraccion()
  ↓
BEGIN TRANSACTION
  ├─ UPDATE tickets SET estado = ?
  ├─ INSERT INTO interacciones (...)
  ↓
COMMIT o ROLLBACK
  ↓
invalida caché
  ↓
retorna resultado
```

### Lectura de Ticket (Con caché)

```
UI → obtenerTicket(ticketId)
  ↓
redis.get(ticket:{ticketId})
  ├─ HIT: retorna desde Redis ✓ (rápido)
  └─ MISS: consulta Turso
     ↓
     SELECT * FROM tickets WHERE id = ?
     ↓
     cachea en Redis
     ↓
     retorna
```

## Seguridad

### Validación de Inputs

- **Zod:** Esquemas de validación en Server Actions
- **Prepared Statements:** @libsql/client evita SQL injection

### Autenticación (Simulada en esta versión)

- **Hashing:** bcryptjs para contraseñas
- **Permiso por Rol:** Sistema de permisos en `/lib/auth/permissions.ts`

### Roles y Permisos

```
cliente: ver/crear propios tickets, comentar
operador: ver todos, asignar, cambiar estado, comentarios internos
admin: acceso completo
```

## Arquitectura de Base de Datos

### Tabla: usuarios

```sql
id (PK)
email (UNIQUE)
nombre
rol (cliente|operador|admin)
password_hash
fecha_creacion
activo
```

### Tabla: tickets

```sql
id (PK)
titulo, descripcion
usuario_id (FK)
estado (abierto|en_progreso|resuelto|cerrado)
prioridad (baja|media|alta|critica)
categoria
fecha_creacion, fecha_actualizacion, fecha_cierre
asignado_a (FK -> usuarios.id)
```

### Tabla: interacciones

```sql
id (PK)
ticket_id (FK) ← ÍNDICE COMPUESTO
usuario_id (FK)
tipo (comentario|cambio_estado|asignacion|cierre)
contenido
metadata (JSON)
fecha_creacion ← ÍNDICE COMPUESTO
es_interno (booleano)
```

**Índice Compuesto Crítico:**

```sql
CREATE INDEX idx_interacciones_ticket_fecha 
ON interacciones(ticket_id, fecha_creacion DESC)
```

- Permite obtener todas las interacciones de un ticket ordenadas eficientemente
- Una sola pasada por el índice en lugar de índice + sort

## Stack Tecnológico Resumido

| Capa | Tecnología | Propósito |
|------|-----------|----------|
| Frontend | React 19 (Client Components) | UI reactiva |
| Backend | Next.js 16 (Server Actions) | Lógica segura |
| Base de Datos | Turso (LibSQL/SQLite) | Persistencia |
| Caché | Upstash Redis | Performance |
| Validación | Zod | Type-safe |
| Hash | bcryptjs | Seguridad |
| HTTP | NextAPI Routes | Metrics |

## Próximos Pasos de Optimización

1. **Índices adicionales** basados en análisis de slow queries
2. **Particionamiento** de interacciones por fecha
3. **Rate limiting** en API endpoints
4. **Autenticación real** con JWT o sessions
5. **Logs estructurados** para debugging
6. **Alertas** en métricas críticas
