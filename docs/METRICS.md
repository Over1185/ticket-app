# Métricas y tuning

| Componente | Métrica | Valor Óptimo | Valor Deficiente | Significado | Acción de Tuning |
|------------|---------|--------------|------------------|-------------|------------------|
| Turso | Tiempo promedio de query | < 50ms | > 200ms | Queries lentas afectan UX | 1. Analizar queries con EXPLAIN<br>2. Agregar índices faltantes<br>3. Revisar N+1 queries |
| Turso | Uso de índices | > 80% | < 50% | Índices no se usan | 1. ANALYZE para actualizar estadísticas<br>2. Revisar queries sin índices<br>3. Crear índices compuestos |
| Turso | Tamaño tabla interacciones | Variable | > 10GB | Tabla muy grande | 1. Implementar archivado<br>2. Particionar por fecha<br>3. Comprimir datos antiguos |
| Redis | Hit Rate | > 90% | < 70% | Caché ineficiente | 1. Aumentar TTL para datos estables<br>2. Implementar cache warming<br>3. Revisar patrones de acceso |
| Redis | Memoria usada | < 80% | > 90% | Riesgo de eviction | 1. Implementar LRU policy<br>2. Reducir TTL de keys<br>3. Limpiar keys obsoletas |
| Redis | Queue length | < 100 | > 1000 | Batch Worker lento | 1. Aumentar workers<br>2. Optimizar procesamiento<br>3. Implementar prioridades |

## Endpoint de observabilidad

- `/api/metrics` agrega señales básicas: info de Redis, tamaños de tablas, índices.
- Extiende con tracing o logging estructurado si se requiere SLA.
