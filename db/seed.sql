PRAGMA foreign_keys = ON;

-- Usuarios de prueba
INSERT INTO usuarios (email, nombre, rol, password_hash, activo) VALUES
  ('ana.cliente@example.com', 'Ana Cliente', 'cliente', 'hash_demo_ana', 1),
  ('bruno.cliente@example.com', 'Bruno Cliente', 'cliente', 'hash_demo_bruno', 1),
  ('carla.operadora@example.com', 'Carla Operadora', 'operador', 'hash_demo_carla', 1),
  ('diego.operador@example.com', 'Diego Operador', 'operador', 'hash_demo_diego', 1),
  ('admin@example.com', 'Admin', 'admin', 'hash_demo_admin', 1);

-- Tickets de prueba (20)
INSERT INTO tickets (titulo, descripcion, usuario_id, estado, prioridad, categoria, fecha_creacion, fecha_actualizacion, asignado_a) VALUES
  ('Problema de acceso', 'No puedo iniciar sesión en el portal', 1, 'abierto', 'alta', 'autenticacion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3),
  ('Error en factura', 'Monto cobrado incorrecto', 2, 'en_progreso', 'media', 'facturacion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3),
  ('Fallo de notificaciones', 'No llegan correos de alerta', 1, 'abierto', 'media', 'notificaciones', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4),
  ('Solicitud de nueva funcionalidad', 'Agregar exportación a CSV', 2, 'abierto', 'baja', 'feature', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 5),
  ('Bug en dashboard', 'Gráficas no cargan', 1, 'en_progreso', 'alta', 'ui', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4),
  ('Integración con API externa', 'Error 500 al llamar API', 2, 'abierto', 'critica', 'integracion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3),
  ('Cambio de contraseña', 'Restablecer clave olvidada', 1, 'resuelto', 'media', 'autenticacion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4),
  ('Reporte lento', 'Reporte mensual tarda demasiado', 2, 'abierto', 'alta', 'performance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3),
  ('Duplicado de tickets', 'Se crean dos tickets al enviar formulario', 1, 'abierto', 'media', 'bug', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3),
  ('Error 404', 'Página de perfil no existe', 2, 'cerrado', 'baja', 'frontend', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4),
  ('Sincronización fallida', 'Datos no se sincronizan con CRM', 1, 'en_progreso', 'critica', 'integracion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 5),
  ('Timeout frecuente', 'Operaciones expiran a los 30s', 2, 'abierto', 'alta', 'backend', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3),
  ('Bug en formulario', 'Validaciones no funcionan', 1, 'abierto', 'media', 'ui', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4),
  ('Acceso denegado', 'Operador no puede ver tickets', 2, 'abierto', 'alta', 'permisos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 5),
  ('Exportación falla', 'CSV contiene caracteres raros', 1, 'abierto', 'media', 'feature', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3),
  ('Sin logs', 'No se generan logs de auditoría', 2, 'abierto', 'alta', 'observabilidad', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 5),
  ('Bug mobile', 'Vista móvil rota', 1, 'en_progreso', 'alta', 'mobile', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4),
  ('Carga inicial lenta', 'Home carga en 8s', 2, 'abierto', 'critica', 'performance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3),
  ('Error cron', 'Tareas programadas no corren', 1, 'abierto', 'alta', 'backend', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 5),
  ('Campos obligatorios', 'Formulario permite enviar vacío', 2, 'abierto', 'baja', 'bug', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4);

-- 100 interacciones generadas con CTE para distribuir actividades
WITH RECURSIVE seq(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 100
)
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, metadata, fecha_creacion, es_interno)
SELECT
  ((n - 1) % 20) + 1 AS ticket_id,
  ((n - 1) % 5) + 1 AS usuario_id,
  CASE ((n - 1) % 4)
    WHEN 0 THEN 'comentario'
    WHEN 1 THEN 'cambio_estado'
    WHEN 2 THEN 'asignacion'
    ELSE 'cierre'
  END AS tipo,
  'Interaccion ' || n AS contenido,
  json('{"source":"seed","seq":' || n || '}') AS metadata,
  datetime('now', '-' || n || ' minutes') AS fecha_creacion,
  CASE WHEN (n % 5) = 0 THEN 1 ELSE 0 END AS es_interno
FROM seq;
