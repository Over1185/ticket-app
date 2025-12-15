-- Schema inicial para el Sistema de Gestión de Tickets
-- Base de datos: Turso (LibSQL/SQLite)
-- Fecha: Diciembre 2024

-- =====================================================
-- TABLA: usuarios
-- =====================================================
-- Almacena los usuarios del sistema con roles diferenciados
-- Índices: email (UNIQUE para búsquedas rápidas por credenciales)

CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT CHECK(rol IN ('cliente', 'operador', 'admin')) NOT NULL,
  password_hash TEXT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT 1,
  
  -- Índice para búsquedas por email (login)
  UNIQUE(email)
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- =====================================================
-- TABLA: tickets
-- =====================================================
-- Almacena los tickets de soporte creados por usuarios
-- Campos estado y prioridad controlados por CHECK
-- Índices compuestos para las consultas más frecuentes

CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  estado TEXT CHECK(estado IN ('abierto', 'en_progreso', 'resuelto', 'cerrado')) DEFAULT 'abierto',
  prioridad TEXT CHECK(prioridad IN ('baja', 'media', 'alta', 'critica')) DEFAULT 'media',
  categoria TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATETIME,
  asignado_a INTEGER REFERENCES usuarios(id)
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX idx_tickets_usuario_id ON tickets(usuario_id);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_fecha_creacion ON tickets(fecha_creacion DESC);
CREATE INDEX idx_tickets_asignado_a ON tickets(asignado_a);

-- Índice compuesto para consultas por estado y fecha
CREATE INDEX idx_tickets_estado_fecha ON tickets(estado, fecha_actualizacion DESC);

-- =====================================================
-- TABLA: interacciones
-- =====================================================
-- Almacena todas las interacciones relacionadas con tickets
-- Tipo de interacción: comentario, cambio_estado, asignacion, cierre
-- metadata: JSON con información adicional
-- es_interno: solo visible para operadores

CREATE TABLE interacciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  tipo TEXT CHECK(tipo IN ('comentario', 'cambio_estado', 'asignacion', 'cierre')) NOT NULL,
  contenido TEXT,
  metadata TEXT, -- JSON
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  es_interno BOOLEAN DEFAULT 0
);

-- ÍNDICE COMPUESTO CRÍTICO
-- Este índice es fundamental para la optimización de consultas
-- Las consultas más frecuentes son: obtener todas las interacciones de un ticket ordenadas por fecha
-- CREATE INDEX idx_interacciones_ticket_fecha ON interacciones(ticket_id, fecha_creacion DESC);
-- Justificación:
-- 1. Primera columna (ticket_id): filtra rápidamente las interacciones de un ticket específico
-- 2. Segunda columna (fecha_creacion DESC): ordena en la dirección correcta sin necesidad de sort adicional
-- 3. Este índice cubre completamente consultas como:
--    SELECT * FROM interacciones WHERE ticket_id = ? ORDER BY fecha_creacion DESC
-- 4. Reduce significativamente la carga en lectura para timelines de tickets

CREATE INDEX idx_interacciones_ticket_fecha ON interacciones(ticket_id, fecha_creacion DESC);
CREATE INDEX idx_interacciones_usuario_id ON interacciones(usuario_id);
CREATE INDEX idx_interacciones_tipo ON interacciones(tipo);

-- =====================================================
-- VISTA: tickets_con_detalles
-- =====================================================
-- Vista útil para obtener tickets con información del usuario y operador

CREATE VIEW tickets_con_detalles AS
SELECT
  t.id,
  t.titulo,
  t.descripcion,
  t.estado,
  t.prioridad,
  t.categoria,
  t.fecha_creacion,
  t.fecha_actualizacion,
  t.fecha_cierre,
  u.id as usuario_id,
  u.email as usuario_email,
  u.nombre as usuario_nombre,
  o.id as operador_id,
  o.email as operador_email,
  o.nombre as operador_nombre
FROM tickets t
JOIN usuarios u ON t.usuario_id = u.id
LEFT JOIN usuarios o ON t.asignado_a = o.id;
