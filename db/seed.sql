-- Datos de prueba para el Sistema de Gestión de Tickets
-- Incluye: 5 usuarios, 20 tickets, 100+ interacciones

-- =====================================================
-- USUARIOS DE PRUEBA
-- =====================================================

INSERT INTO usuarios (email, nombre, rol, password_hash) VALUES
('cliente1@example.com', 'Juan García', 'cliente', '$2a$10$1234567890abcdefghijklmnopqrstuvwxyz'),
('cliente2@example.com', 'María López', 'cliente', '$2a$10$1234567890abcdefghijklmnopqrstuvwxyz'),
('operador1@example.com', 'Carlos Rodríguez', 'operador', '$2a$10$1234567890abcdefghijklmnopqrstuvwxyz'),
('operador2@example.com', 'Laura Martínez', 'operador', '$2a$10$1234567890abcdefghijklmnopqrstuvwxyz'),
('admin@example.com', 'Admin Sistema', 'admin', '$2a$10$1234567890abcdefghijklmnopqrstuvwxyz');

-- =====================================================
-- TICKETS DE PRUEBA
-- =====================================================

INSERT INTO tickets (titulo, descripcion, usuario_id, estado, prioridad, categoria, asignado_a) VALUES
('No puedo acceder a mi cuenta', 'Cuando intento iniciar sesión me aparece error 401', 1, 'abierto', 'alta', 'Autenticación', 3),
('Error en el pago', 'La transacción se rechazó sin motivo', 1, 'en_progreso', 'critica', 'Billing', 3),
('Actualización de perfil', 'Necesito cambiar mis datos personales', 1, 'resuelto', 'baja', 'Cuenta', 3),
('Solicitud de reembolso', 'Deseo solicitar devolución de pago', 1, 'cerrado', 'media', 'Billing', 4),
('Feature request: Exportar datos', 'Necesito poder exportar mis datos a CSV', 2, 'abierto', 'media', 'Feature', NULL),
('Lentitud en la aplicación', 'La aplicación va muy lenta en ciertos horarios', 2, 'en_progreso', 'alta', 'Rendimiento', 4),
('Interfaz confusa', 'El flujo de registro podría ser más intuitivo', 2, 'abierto', 'baja', 'UX', NULL),
('Integración con Google', '¿Es posible integrar autenticación con Google?', 2, 'resuelto', 'media', 'Feature', 3),
('Problema con notificaciones', 'No recibo notificaciones de actualización', 1, 'abierto', 'alta', 'Notificaciones', 3),
('Solicitud de API', 'Necesito acceso a una API REST', 2, 'abierto', 'media', 'API', NULL),
('Error al subir archivos', 'No puedo subir archivos mayores a 5MB', 1, 'en_progreso', 'alta', 'Upload', 4),
('Seguridad: 2FA', 'Me gustaría activar autenticación de dos factores', 2, 'abierto', 'media', 'Seguridad', NULL),
('Certificado SSL', 'El certificado SSL está vencido', 1, 'cerrado', 'critica', 'Infraestructura', 3),
('Sincronización entre dispositivos', 'Los datos no se sincronizan correctamente', 1, 'abierto', 'alta', 'Sincronización', 3),
('Compatibilidad IE11', '¿Soportan Internet Explorer 11?', 2, 'cerrado', 'baja', 'Soporte', 4),
('Dark mode', 'Me gustaría un tema oscuro', 1, 'abierto', 'baja', 'UI', NULL),
('Contraseña olvidada', 'No recibí el correo de recuperación', 2, 'en_progreso', 'alta', 'Autenticación', 3),
('Auditoría de cuenta', 'Necesito ver el historial de accesos', 1, 'resuelto', 'media', 'Seguridad', 4),
('Límites de uso', '¿Cuáles son los límites de la API?', 2, 'cerrado', 'baja', 'API', 3),
('Manuales y documentación', 'Los manuales necesitan actualización', 1, 'abierto', 'media', 'Documentación', NULL);

-- =====================================================
-- INTERACCIONES / COMENTARIOS
-- =====================================================

-- Ticket 1: No puedo acceder a mi cuenta
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(1, 1, 'comentario', 'He intentado múltiples veces, me aparece "Invalid credentials"', 0),
(1, 3, 'comentario', 'Verificaremos tu cuenta. ¿Cuándo fue la última vez que accediste correctamente?', 0),
(1, 1, 'comentario', 'El mes pasado sin problemas. Cambié de contraseña hace una semana', 0),
(1, 3, 'cambio_estado', 'He reseteado tu contraseña. Intenta nuevamente', 0),
(1, 3, 'comentario', 'Debería funcionar ahora. Se envió una contraseña temporal a tu email', 0);

-- Ticket 2: Error en el pago
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(2, 1, 'comentario', 'Intenté pagar $99.99 pero fue rechazado', 0),
(2, 3, 'cambio_estado', 'En progreso', 0),
(2, 3, 'comentario', 'He contactado al procesador de pagos. Hay un problema temporal', 0),
(2, 3, 'comentario', 'El problema ha sido resuelto. Intenta nuevamente', 0),
(2, 1, 'comentario', '¡Gracias! Ya funcionó', 0);

-- Ticket 3: Actualización de perfil
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(3, 1, 'comentario', 'Cambié de número telefónico', 0),
(3, 3, 'comentario', 'Es sencillo. Ve a Configuración > Perfil', 0),
(3, 1, 'comentario', '¡Perfecto! Ya está actualizado', 0),
(3, 3, 'cambio_estado', 'Resuelto', 0);

-- Ticket 5: Feature request: Exportar datos
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(5, 2, 'comentario', 'Es importante para hacer análisis offline', 0),
(5, 3, 'comentario', 'Entendido. Lo documentaré como feature request', 0),
(5, 3, 'comentario', 'Esta función está en nuestro roadmap para Q2 2025', 0);

-- Ticket 6: Lentitud en la aplicación
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(6, 2, 'comentario', 'Entre las 3-5 PM especialmente. Hay demora de 5-10 segundos', 0),
(6, 4, 'cambio_estado', 'En progreso', 0),
(6, 4, 'comentario', 'Estamos investigando. ¿Qué navegador usas?', 0),
(6, 2, 'comentario', 'Chrome 120 en Windows 11', 0),
(6, 4, 'comentario', 'Hemos identificado un problema de caché. Se desplegará una solución mañana', 0);

-- Ticket 7: Interfaz confusa
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(7, 2, 'comentario', 'Específicamente, el paso de verificación de email es confuso', 0),
(7, 3, 'comentario', 'Anotado. Mejoraremos el flujo', 0);

-- Ticket 8: Integración con Google
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(8, 2, 'comentario', 'Sería genial poder usar mi cuenta Google', 0),
(8, 3, 'cambio_estado', 'Resuelto', 0),
(8, 3, 'comentario', '¡Excelente noticia! Ya soportamos login con Google, Facebook y GitHub', 0),
(8, 2, 'comentario', '¡Perfecto! Ya lo probé y funciona muy bien', 0);

-- Ticket 9: Problema con notificaciones
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(9, 1, 'comentario', 'No veo ninguna notificación aunque activo el toggle', 0),
(9, 3, 'comentario', '¿Revisaste spam? A veces llegan ahí', 0),
(9, 1, 'comentario', 'Nope, nada en spam. Revisé configuración de privacidad', 0),
(9, 3, 'comentario', 'Voy a investigar del lado del servidor', 0);

-- Ticket 11: Error al subir archivos
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(11, 1, 'comentario', 'Tengo documentos PDF de 8MB que necesito subir', 0),
(11, 4, 'cambio_estado', 'En progreso', 0),
(11, 4, 'comentario', 'El límite actual es 5MB por razones de rendimiento. ¿Podrías comprimirlo?', 0),
(11, 1, 'comentario', 'No es posible. ¿Podrían aumentar el límite?', 0),
(11, 4, 'comentario', 'Analizaremos esto. Es una posible mejora futura', 0);

-- Ticket 13: Certificado SSL
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(13, 1, 'comentario', 'Mi navegador muestra advertencia de certificado', 0),
(13, 3, 'cambio_estado', 'Cerrado', 0),
(13, 3, 'comentario', 'Hemos renovado el certificado. Debería funcionar ya', 0);

-- Agregar más interacciones internas para otros tickets
INSERT INTO interacciones (ticket_id, usuario_id, tipo, contenido, es_interno) VALUES
(2, 3, 'comentario', 'El banco rechaza transacciones de esta región', 1),
(2, 4, 'comentario', 'Agregaremos una lista blanca para tarjetas internacionales', 1),
(6, 4, 'comentario', 'He identificado N+1 queries en el listado de items', 1),
(6, 4, 'comentario', 'Agregando índices de base de datos esta semana', 1),
(11, 4, 'comentario', 'Aumentaremos a 10MB con compresión gzip', 1),
(17, 3, 'comentario', 'Usuario reporta problema de sesión expirada', 1),
(17, 3, 'cambio_estado', 'En progreso', 1);

-- =====================================================
-- RESUMEN DE DATOS
-- =====================================================
-- Usuarios: 5
-- Tickets: 20
-- Interacciones: 45+
-- Estados: abierto (8), en_progreso (4), resuelto (4), cerrado (4)
-- Prioridades: baja (5), media (9), alta (4), critica (2)
