# Concurrencia y transacciones

## Escenarios

1) Usuario cambia estado mientras operador registra interacción. Sin transacción, el estado podría quedar actualizado sin traza o viceversa. Con transacción, ambos pasos se confirman o revierten juntos.
2) Lectura sucia (dirty read): un proceso lee estado no confirmado de otro. Evitado manteniendo aislamiento y confirmando antes de exponer cambios.
3) Actualización perdida (lost update): dos procesos sobrescriben el mismo registro. Se mitiga actualizando dentro de transacciones y, si es necesario, agregando versiones (`row_version`).
4) Phantom read: nuevas filas apareciendo entre lecturas. Para reportes críticos, usar lecturas consistentes o bloqueos de rango.

## Niveles de aislamiento (SQLite/Turso)

- `READ COMMITTED` (por defecto): cada statement ve solo datos confirmados.
- `SERIALIZABLE`: evita phantoms mediante control de versiones; usar para operaciones críticas.

## Ejemplo con transacción (implementado en `actualizarTicketConInteraccion`)

```ts
const tx = await db.transaction();
try {
  await tx.execute({ sql: "UPDATE tickets SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?", args: [estado, ticketId] });
  await tx.execute({ sql: "INSERT INTO interacciones (...) VALUES (?)", args: [...] });
  await tx.commit();
} catch (e) {
  await tx.rollback();
}
```

## Ejemplo sin transacción (evitar)

```ts
await db.execute({ sql: "UPDATE tickets SET estado = ? WHERE id = ?", args: [estado, id] });
await db.execute({ sql: "INSERT INTO interacciones ..." });
// Si la segunda falla, el ticket cambia sin historial.
```

## Buenas prácticas

- Validar entrada antes de abrir la transacción.
- Mantener transacciones cortas para reducir contención.
- Registrar interacciones junto al cambio de estado.
- Para lotes, usar cola Redis y procesar en worker para evitar lock prolongado.
