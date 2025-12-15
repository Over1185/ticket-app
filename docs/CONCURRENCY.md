# Concurrencia - Transacciones y Problemas de Sincronización

## Problema de Concurrencia

Imagina este escenario:

**Situación:**

- Un cliente intenta cambiar el estado de un ticket a "resuelto"
- Simultáneamente, un operador agrega un comentario al mismo ticket
- Sin transacciones, podrían ocurrir inconsistencias

## Problemas de Concurrencia Sin Transacciones

### 1. Lectura Sucia (Dirty Read)

```sql
Transacción A: BEGIN
  UPDATE tickets SET estado = 'resuelto' WHERE id = 5
  
Transacción B: BEGIN
  SELECT * FROM tickets WHERE id = 5  
  -- Lee: estado = 'resuelto' (aunque A no hizo COMMIT aún)

Transacción A: ROLLBACK  -- Algo falló!

-- PROBLEMA: B leyó datos que no se confirmaron (dirty read)
```

**Impacto:** B procesa datos que podrían no ser válidos

### 2. Actualización Perdida (Lost Update)

```sql
Transacción A: SELECT estado FROM tickets WHERE id = 5
  -- Lee: estado = 'abierto'

Transacción B: SELECT estado FROM tickets WHERE id = 5
  -- Lee: estado = 'abierto'

Transacción A: UPDATE tickets SET estado = 'en_progreso' WHERE id = 5

Transacción B: UPDATE tickets SET estado = 'resuelto' WHERE id = 5

-- PROBLEMA: Cambio de A se perdió. Prevalece B
-- Esperado: 'resuelto'
-- Actual: 'resuelto' ✓ (pero por suerte)
-- En otro caso: 'en_progreso' (actualización de A perdida)
```

**Impacto:** Cambios simultáneos se sobrescriben

### 3. Lectura Fantasma (Phantom Read)

```sql
Transacción A: BEGIN
  SELECT COUNT(*) FROM tickets WHERE estado = 'abierto'
  -- Result: 5 tickets
  
  -- [B crea un nuevo ticket abierto y hace COMMIT]
  
  SELECT COUNT(*) FROM tickets WHERE estado = 'abierto'
  -- Result: 6 tickets ¡Cambió!
  
-- PROBLEMA: El conjunto de filas cambió entre lecturas
```

**Impacto:** Inconsistencia en agregaciones

## Niveles de Aislamiento

SQLite soporta:

- **Serializable:** Máxima consistencia (predeterminado en transacciones)
- **Deferred:** Transacciones diferidas (compatible con concurrencia)

## Solución: Transacciones ACID

### Implementación en Next.js

```typescript
// src/lib/db/client.ts

export async function transaction<T>(
  callback: (client: typeof db) => Promise<T>
): Promise<T> {
  try {
    await db.execute('BEGIN TRANSACTION')
    
    // Todas las operaciones aquí se ejecutan juntas
    const result = await callback(db)
    
    await db.execute('COMMIT')  // Confirmar todo
    return result
    
  } catch (error) {
    await db.execute('ROLLBACK')  // Deshacer todo
    throw error
  }
}
```

### Caso 1: Actualizar Ticket + Registrar Interacción

**PROBLEMA SIN TRANSACCIÓN:**

```
UPDATE tickets SET estado = 'en_progreso'
INSERT INTO interacciones (...)

Si algo falla entre estos dos, el estado cambió pero no hay registro
```

**SOLUCIÓN CON TRANSACCIÓN:**

```typescript
// src/app/actions/tickets.ts

export async function actualizarTicketConInteraccion(
  ticketId: number,
  nuevoEstado: string,
  usuarioId: number,
  comentario?: string
) {
  // Ambas operaciones se ejecutan juntas, o ninguna
  return await transaction(async (client) => {
    // 1. UPDATE
    await execute(
      `UPDATE tickets SET estado = ?, fecha_actualizacion = ? WHERE id = ?`,
      [nuevoEstado, new Date(), ticketId]
    )
    
    // 2. INSERT
    const result = await execute(
      `INSERT INTO interacciones (...) VALUES (?)`,
      [ticketId, usuarioId, 'cambio_estado', comentario]
    )
    
    // Si algo falla aquí, ROLLBACK deshace ambos cambios
    return { ticketId, interaccionId: result.lastInsertRowid }
  })
}
```

**Garantía ACID:**

- **Atomicidad:** Ambas operaciones o ninguna
- **Consistencia:** Estado del ticket siempre coincide con interacción
- **Aislamiento:** Otros usuarios no ven cambios parciales
- **Durabilidad:** Una vez COMMITed, persiste

### Caso 2: Asignar Ticket (Cambio de estado implícito)

```typescript
export async function asignarTicketConInteraccion(
  ticketId: number,
  operadorId: number,
  usuarioQuienAsigna: number
): Promise<{ ticketId: number; interaccionId: number }> {
  return await transaction(async (client) => {
    // Actualizar asignación
    await execute(
      `UPDATE tickets SET asignado_a = ?, fecha_actualizacion = ? WHERE id = ?`,
      [operadorId, new Date(), ticketId]
    )
    
    // Registrar la acción
    const result = await execute(
      `INSERT INTO interacciones (ticket_id, usuario_id, tipo, metadata) VALUES (?)`,
      [ticketId, usuarioQuienAsigna, 'asignacion', 
       JSON.stringify({ asignado_a: operadorId })]
    )
    
    return { ticketId, interaccionId: Number(result.lastInsertRowid) }
  })
}
```

## Escenario Real: Concurrencia Alta

**Línea temporal de ejecución:**

```
T=0ms   Cliente A: BEGIN TRANSACTION
        [obtiene lock en tabla tickets]

T=5ms   Cliente B: BEGIN TRANSACTION
        [espera lock...]

T=10ms  Cliente A: UPDATE tickets SET estado = 'resuelto'
        [lock exclusivo mantenido]

T=15ms  Cliente A: INSERT interacciones ...
        
T=20ms  Cliente A: COMMIT
        [libera lock]

T=21ms  Cliente B: obtiene lock
        
T=25ms  Cliente B: SELECT * FROM tickets (estado = 'resuelto')
        
T=30ms  Cliente B: COMMIT
```

**Resultado:** Operaciones serializadas correctamente, no hay race conditions

## Ventajas del Modelo de Turso/SQLite

1. **Simple:** No requiere configuración compleja
2. **Confiable:** SQLite maneja locks automáticamente
3. **ACID:** Todas las propiedades garantizadas
4. **Escalable:** Con Redis, Turso soporta miles de conexiones

## Limitaciones y Alternativas

### Limitación: Transacciones Largas

```typescript
// PROBLEMÁTICO: Transacción muy larga
export async function procesoLargo(ticketId: number) {
  return await transaction(async () => {
    // ... operaciones de BD ...
    
    await fetch('https://external-api.com/notify')  // ¡LARGO!
    
    // ... más operaciones ...
  })
  // Lock mantenido durante toda la llamada HTTP
}

// SOLUCIÓN: Operación de BD en transacción, luego notificación fuera
export async function procesoMejor(ticketId: number) {
  const resultado = await transaction(async () => {
    // Solo operaciones de BD, rápido
    return await execute(...)
  })
  
  // Operación lenta fuera de transacción
  await enqueueTask('send_notifications', { ticketId })
}
```

### Patrón: Transacciones + Colas

Para operaciones que requieren pasos externos:

```
1. BEGIN TRANSACTION
   - Cambiar estado de ticket
   - Registrar interacción
2. COMMIT
3. Enqueue tarea en Redis (enviar email, notificación, etc.)
4. Batch worker procesa tarea asincronicamente
```

## Testing de Concurrencia

```typescript
// test/concurrency.test.ts

describe('Concurrencia de Tickets', () => {
  it('dos usuarios actualizan ticket simultáneamente', async () => {
    const ticketId = 1
    
    // Simular dos actualizaciones concurrentes
    const [resultado1, resultado2] = await Promise.all([
      actualizarTicketConInteraccion(
        ticketId, 'en_progreso', 1, 'Comentario 1'
      ),
      actualizarTicketConInteraccion(
        ticketId, 'resuelto', 2, 'Comentario 2'
      )
    ])
    
    // Verificar consistencia
    const interacciones = await listarInteraccionesDelTicket(ticketId)
    expect(interacciones).toHaveLength(2)  // Ambos registrados
    
    // Verificar estado final
    const ticket = await obtenerTicket(ticketId)
    expect(ticket.estado).toEqual('resuelto')  // Última ganó
  })
})
```

## Resumen

| Concepto | Sin Transacción | Con Transacción |
|----------|-----------------|-----------------|
| Dirty Read | ✗ Posible | ✓ Imposible |
| Lost Update | ✗ Posible | ✓ Imposible |
| Phantom Read | ✗ Posible | ✓ Raro |
| Consistencia | Débil | Fuerte |
| Performance | Mejor | Ligeramente peor |
| Fiabilidad | Baja | Alta |

**Regla de oro:** Usa transacciones para operaciones que deben ser consistentes juntas.

## Código Checklist

- [x] Transacciones en operaciones múltiples (cambio estado + interacción)
- [x] Validación de inputs antes de transacción
- [x] Rollback automático en errores
- [x] Cachés invalidados después de transacción
- [x] Logs de errores para debugging
- [ ] Monitoreo de duración de transacciones
- [ ] Alertas si transacciones toman > 1 segundo
