# Estrategia de respaldo

## 1. Respaldo completo (Full Backup)

- Frecuencia: Diario a las 2:00 AM
- Comando: `turso db dump` o exportación SQLite
- Retención: 7 días

## 2. Respaldo incremental/diferencial

- Turso maneja replicación; alternativa: exportar cambios cada hora
- Retención: 24 horas

## 3. Logs transaccionales

- Turso mantiene WAL (Write-Ahead Log)
- Permite Point-in-Time Recovery (PITR)
- RPO objetivo: 15 minutos

## 4. Tareas de mantenimiento

- `REINDEX` mensual
- `PRAGMA integrity_check` semanal
- `ANALYZE` diario
- `VACUUM` semanal

## 5. Procedimiento de recuperación puntual

```bash
# Recuperar a timestamp específico
# turso db restore --timestamp "2024-01-15T10:30:00Z"

# O desde backup específico
# turso db restore --from-backup backup-20240115
```
