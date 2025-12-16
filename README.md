# Ticket App 🚀

**Sistema de gestión de tickets** construido con **Next.js** y pensado para demostraciones y pruebas (Turso + Redis en la arquitectura). Puedes ver la versión desplegada aquí:

🔗 <https://ticket-app-jade-ten.vercel.app/>

---

## 🔎 ¿Qué incluye este repositorio?

- Código de la aplicación (Frontend + Server Actions) en `src/app`
- Conexiones y utilidades en `src/lib` (DB, Redis, auth, etc.)
- Scripts útiles en `scripts/` (por ejemplo: `db-setup.js`)
- Documentación técnica en el directorio `docs/` — ver detalles abajo

---

## 📚 Documentación

Toda la documentación del proyecto está en la carpeta `docs/`. Aquí las más relevantes:

- [**ARCHITECTURE.md**](https://github.com/Over1185/ticket-app/blob/main/docs/ARCHITECTURE.md) — Arquitectura general y componentes (Turso, Redis, Next.js)
- [**BACKUP.md**](https://github.com/Over1185/ticket-app/blob/main/docs/BACKUP.md) — Estrategia de backups y procedimientos de restauración
- [**CONCURRENCY.md**](https://github.com/Over1185/ticket-app/blob/main/docs/CONCURRENCY.md) — Políticas y patrones de concurrencia / transacciones
- [**METRICS.md**](https://github.com/Over1185/ticket-app/blob/main/docs/METRICS.md) — Métricas, monitoreo y endpoints disponibles
- [**REDIS.md**](https://github.com/Over1185/ticket-app/blob/main/docs/REDIS.md) — Estrategia de caché y sistema de colas
- [**SECURITY.md**](https://github.com/Over1185/ticket-app/blob/main/docs/SECURITY.md) — Roles, permisos y buenas prácticas de seguridad

---

## ⚙️ Requisitos y puesta en marcha

Requisitos recomendados:

- Node.js >= 18
- pnpm (o npm/yarn)
- Variables de entorno para la BD y Redis (revisa `src/lib/redis` y `src/lib/db`)

Comandos básicos:

```bash
# Instalar dependencias
pnpm install

# Levantar en modo desarrollo
pnpm dev

# Build para producción
pnpm build
pnpm start
```

Para inicializar la base de datos localmente revisa `scripts/db-setup.js` y la carpeta `db/`.

