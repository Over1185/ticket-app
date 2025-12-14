PRAGMA foreign_keys = ON;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('cliente', 'operador', 'admin')),
  password_hash TEXT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN NOT NULL DEFAULT 1,
  CHECK (length(email) > 3)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Tabla de tickets
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_progreso', 'resuelto', 'cerrado')),
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  categoria TEXT,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATETIME,
  asignado_a INTEGER REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_tickets_usuario_id ON tickets(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_creacion ON tickets(fecha_creacion);

-- Tabla de interacciones
CREATE TABLE IF NOT EXISTS interacciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('comentario', 'cambio_estado', 'asignacion', 'cierre')),
  contenido TEXT,
  metadata TEXT,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  es_interno BOOLEAN NOT NULL DEFAULT 0
);

-- Índice compuesto crítico para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_interacciones_ticket_fecha
  ON interacciones(ticket_id, fecha_creacion DESC);
