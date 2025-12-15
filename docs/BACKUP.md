# Backup y Recuperación

## Estrategia de Respaldo

### Turso (Managed Backup)

Turso proporciona backups automáticos, pero documentamos la estrategia:

#### 1. Respaldo Automático (Turso)

```bash
# Turso mantiene automáticamente:
# - Snapshots diarios
# - Replicación en múltiples regiones
# - Write-Ahead Log (WAL) para recuperación puntual

# CLI para ver backups
turso db list

# Información de base de datos
turso db show tickets-db-over1185
```

#### 2. Respaldo Completo (Full Backup)

**Frecuencia:** Diarios a las 2:00 AM UTC

**Comando:**

```bash
# Exportar base de datos completa
turso db dump tickets-db-over1185 > backup_$(date +%Y%m%d).sql
```

**Retención:** 7 días

**Almacenamiento:** Cloud Storage (AWS S3, Google Cloud, etc.)

#### 3. Respaldo Incremental (WAL)

Turso maneja esto automáticamente con su sistema de replicación.

**Alternativa Manual:**

```bash
# Exportar cambios cada hora
# Utilizando timestamps en tablas
SELECT * FROM interacciones 
WHERE fecha_creacion > datetime('now', '-1 hour')
```

**Retención:** 24 horas

#### 4. Logs Transaccionales

```sql
-- Verificar integridad
PRAGMA integrity_check;

-- Ver WAL stats (SQLite interno)
PRAGMA wal_autocheckpoint;

-- Forzar checkpoint
PRAGMA wal_checkpoint(RESTART);
```

## Tareas de Mantenimiento

### 1. Reconstrucción de Índices (Mensual)

```sql
-- Reconstruir todos los índices
REINDEX;

-- Resultado
-- REINDEX completed successfully
```

**Propósito:** Optimizar índices fragmentados

### 2. Verificación de Integridad (Semanal)

```sql
-- Ejecutar análisis completo
PRAGMA integrity_check;

-- Salida esperada:
-- ok (si no hay problemas)

-- O detalle de problemas:
-- wrong # of entries in index idx_usuarios_email
```

**Acción si hay problemas:**

```sql
REINDEX idx_usuarios_email;
```

### 3. Actualización de Estadísticas (Diaria)

```sql
-- Actualizar estadísticas de optimizador
ANALYZE;

-- Verifica selectividad de índices
-- Mejora QUERY PLAN
```

**Beneficio:** Mejor desempeño de queries

### 4. Limpieza de Espacio (Semanal)

```sql
-- Recuperar espacio no utilizado
VACUUM;

-- Resultado:
-- Espacio recuperado: ~50MB
```

**Nota:** VACUUM puede tomar tiempo, ejecutar en mantenimiento

### 5. Limpieza de Datos Antiguos (Mensual)

```sql
-- Archivar interacciones con más de 90 días
INSERT INTO interacciones_archived 
SELECT * FROM interacciones 
WHERE fecha_creacion < datetime('now', '-90 days');

-- Eliminar de tabla principal
DELETE FROM interacciones 
WHERE fecha_creacion < datetime('now', '-90 days');
```

## Procedimiento de Recuperación Puntual (PITR)

### Scenario: Corrupción de Datos

```sql
-- Problema: Alguien eliminó tickets accidentalmente
-- Hora del incidente: 2024-12-14 14:30:00 UTC
-- Acción: Recuperar base de datos a hora anterior
```

### Pasos

#### 1. Verificar Backup Disponible

```bash
turso db show tickets-db-over1185
# Información de backups disponibles
```

#### 2. Restaurar Base de Datos Completa

```bash
# Método 1: Desde snapshot anterior
turso db restore tickets-db-over1185 \
  --timestamp "2024-12-14T14:00:00Z"

# Método 2: Desde backup específico
turso db restore tickets-db-over1185 \
  --from-backup backup-20241214-0200
```

#### 3. Validar Datos Restaurados

```sql
-- Verificar que datos existen
SELECT COUNT(*) as total_tickets FROM tickets;

-- Comparar con timestamp anterior
SELECT 
  COUNT(*) as total,
  MAX(fecha_creacion) as fecha_mas_reciente
FROM tickets;
```

#### 4. Recuperación Selectiva (Si es necesario)

```sql
-- Si solo necesitas recuperar ciertos registros:
-- 1. Crear tabla temporal
CREATE TABLE tickets_temp AS 
SELECT * FROM tickets_backup 
WHERE usuario_id = 42 
AND fecha_creacion > '2024-12-14T14:00:00Z';

-- 2. Validar datos
SELECT COUNT(*) FROM tickets_temp;

-- 3. Merge si es necesario
INSERT OR REPLACE INTO tickets 
SELECT * FROM tickets_temp;

-- 4. Limpiar
DROP TABLE tickets_temp;
```

## Monitoreo de Backups

### Script de Verificación Automática

```typescript
// scripts/backup-check.ts

import { db } from '@/lib/db/client'

async function verifyBackup() {
  try {
    // 1. Verificar integridad
    const integrityResult = await db.execute('PRAGMA integrity_check')
    if (integrityResult.rows[0] !== 'ok') {
      throw new Error('Integrity check failed')
    }
    
    // 2. Verificar conteos
    const ticketsCount = await db.execute(
      'SELECT COUNT(*) as count FROM tickets'
    )
    const usuariosCount = await db.execute(
      'SELECT COUNT(*) as count FROM usuarios'
    )
    
    console.log('✓ Backup verificado exitosamente')
    console.log(`  - Integridad: OK`)
    console.log(`  - Tickets: ${ticketsCount.rows[0].count}`)
    console.log(`  - Usuarios: ${usuariosCount.rows[0].count}`)
    
    // 3. Enviar notificación
    await notificarBackupOK()
    
  } catch (error) {
    console.error('✗ Error en backup:', error)
    await notificarBackupError(error)
  }
}

// Ejecutar diariamente
// Configurar en cron job o GitHub Actions
```

### GitHub Actions para Backups Automáticos

```yaml
# .github/workflows/backup.yml

name: Database Backup

on:
  schedule:
    # Todos los días a las 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Backup Database
        run: |
          turso db dump ${{ secrets.TURSO_DB_NAME }} \
            > backup_$(date +%Y%m%d).sql
        env:
          TURSO_API_TOKEN: ${{ secrets.TURSO_API_TOKEN }}
      
      - name: Upload to S3
        run: |
          aws s3 cp backup_*.sql s3://my-backups/
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Verify Backup
        run: npm run backup:verify
      
      - name: Notify Slack
        if: always()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"Backup completado"}'
```

## Runbook de Desastres

### Scenario 1: Base de Datos No Responde

```bash
# 1. Verificar estado
turso db stat tickets-db-over1185

# 2. Intentar reconectar
turso db shell tickets-db-over1185

# 3. Si no funciona, escalar
# - Contactar soporte de Turso
# - Usar última replica conocida
# - Restaurar desde backup
```

### Scenario 2: Datos Corruptos

```bash
# 1. Detener aplicación (prevenir más corrupción)
# 2. Ejecutar verificación
turso db shell tickets-db-over1185
# PRAGMA integrity_check;

# 3. Si hay corrupción
# Restaurar a punto anterior
turso db restore tickets-db-over1185 --timestamp "2024-12-14T10:00:00Z"

# 4. Revalidar
turso db shell tickets-db-over1185
# SELECT COUNT(*) FROM tickets;

# 5. Reiniciar aplicación
```

### Scenario 3: Pérdida de Datos Accidental

```bash
# 1. Contactar admin inmediatamente
# 2. Identificar hora exacta del error
# 3. Usar Point-in-Time Recovery

turso db restore tickets-db-over1185 \
  --timestamp "2024-12-14T14:00:00Z"

# 4. Validar en ambiente de staging primero
# 5. Comunicar a usuarios del RTO/RPO
```

## SLA y Objetivos

| Métrica | Target | Implementación |
|---------|--------|-----------------|
| RTO (Recovery Time Objective) | < 1 hora | Restore desde backup |
| RPO (Recovery Point Objective) | < 15 min | Backups c/15 min + WAL |
| Durabilidad | 99.99% | Replicación de Turso |
| Disponibilidad | 99.9% | Múltiples regiones |
| Verificación | Semanal | Script automático |

## Checklist de Backup

- [x] Backups automáticos configurados en Turso
- [x] Procedimiento de restauración documentado
- [x] Tareas de mantenimiento programadas
- [x] Verificación de integridad semanal
- [x] Logs transaccionales guardados
- [ ] Backups replicados a múltiples regiones
- [ ] Cifrado de backups en tránsito y en reposo
- [ ] Testing regular de recuperación (disaster drills)
- [ ] Documentación de runbooks
- [ ] Alertas en fallos de backup
- [ ] Métricas de backup en dashboard
