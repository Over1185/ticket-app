-- =====================================================
-- MIGRACIÓN 001: Schema Inicial
-- =====================================================
-- Sistema de Gestión de Tickets de Soporte
-- Base de datos: Turso (LibSQL/SQLite)
-- Fecha: Diciembre 2024
-- =====================================================

-- Esta migración crea la estructura inicial de la base de datos
-- Incluye: usuarios, tickets, interacciones y vistas

-- =====================================================
-- TABLA: usuarios
-- =====================================================
-- Almacena todos los usuarios del sistema
-- Roles: cliente (crea tickets), operador (resuelve), admin (todo)

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT CHECK(rol IN ('cliente', 'operador', 'admin')) NOT NULL,
    password_hash TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT 1
);

-- Índice para búsquedas por email (login rápido)
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Índice para filtrar usuarios activos
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- =====================================================
-- TABLA: tickets
-- =====================================================
-- Representa los tickets de soporte creados por usuarios
-- Estados: abierto -> en_progreso -> resuelto/cerrado
-- Prioridades: baja, media (default), alta, critica

CREATE TABLE IF NOT EXISTS tickets (
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

-- Índice para buscar tickets por usuario
CREATE INDEX IF NOT EXISTS idx_tickets_usuario_id ON tickets(usuario_id);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);

-- Índice para ordenar por fecha de creación
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_creacion ON tickets(fecha_creacion DESC);

-- Índice para buscar tickets asignados
CREATE INDEX IF NOT EXISTS idx_tickets_asignado_a ON tickets(asignado_a);

-- Índice compuesto para consultas frecuentes: estado + fecha
CREATE INDEX IF NOT EXISTS idx_tickets_estado_fecha ON tickets(estado, fecha_actualizacion DESC);

-- =====================================================
-- TABLA: interacciones
-- =====================================================
-- Registra toda la actividad de un ticket
-- Tipos: comentario, cambio_estado, asignacion, cierre
-- es_interno: solo visible para operadores/admin

CREATE TABLE IF NOT EXISTS interacciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    tipo TEXT CHECK(tipo IN ('comentario', 'cambio_estado', 'asignacion', 'cierre')) NOT NULL,
    contenido TEXT,
    metadata TEXT, -- JSON para datos adicionales
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    es_interno BOOLEAN DEFAULT 0
);

-- =====================================================
-- ÍNDICE COMPUESTO CRÍTICO
-- =====================================================
-- Este índice es fundamental para la optimización de consultas
-- 
-- Justificación:
-- 1. Primera columna (ticket_id): filtra rápidamente las interacciones
--    de un ticket específico usando búsqueda B-tree
-- 2. Segunda columna (fecha_creacion DESC): ordena en la dirección
--    correcta sin necesidad de sort adicional en memoria
-- 3. Este índice cubre completamente consultas como:
--    SELECT * FROM interacciones WHERE ticket_id = ? ORDER BY fecha_creacion DESC
-- 4. Reduce significativamente la carga en lectura para timelines de tickets
-- 5. El orden DESC permite LIMIT con las interacciones más recientes primero
--
-- Sin este índice:
-- - SQLite tendría que hacer SCAN de toda la tabla
-- - Ordenar en memoria (slow para tablas grandes)
-- - Mayor uso de I/O y CPU
--
-- Con este índice:
-- - Búsqueda O(log n) por ticket_id
-- - Datos ya ordenados por fecha
-- - Lectura secuencial eficiente

CREATE INDEX IF NOT EXISTS idx_interacciones_ticket_fecha ON interacciones(ticket_id, fecha_creacion DESC);

-- Índice para buscar interacciones por usuario
CREATE INDEX IF NOT EXISTS idx_interacciones_usuario_id ON interacciones(usuario_id);

-- Índice para filtrar por tipo de interacción
CREATE INDEX IF NOT EXISTS idx_interacciones_tipo ON interacciones(tipo);

-- =====================================================
-- VISTA: tickets_con_detalles
-- =====================================================
-- Vista útil para obtener tickets con información del usuario y operador
-- Evita JOINs repetitivos en el código

CREATE VIEW IF NOT EXISTS tickets_con_detalles AS
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

-- =====================================================
-- VISTA: estadisticas_tickets
-- =====================================================
-- Vista para métricas y dashboard

CREATE VIEW IF NOT EXISTS estadisticas_tickets AS
SELECT
    estado,
    prioridad,
    COUNT(*) as total,
    AVG(JULIANDAY(fecha_actualizacion) - JULIANDAY(fecha_creacion)) as dias_promedio
FROM tickets
GROUP BY estado, prioridad;

-- =====================================================
-- FIN DE MIGRACIÓN 001
-- =====================================================
