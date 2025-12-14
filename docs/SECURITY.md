# Seguridad y permisos

## Roles lógicos

Definidos en `src/lib/auth/permissions.ts`:

- `api_server`: CRUD de usuarios, tickets e interacciones.
- `batch_worker`: operaciones de mantenimiento y ejecución de procedures.
- `admin`: comodín `*` para todo.

`checkPermission(role, action)` compara la acción contra la lista del rol; `requirePermission` lanza error si no está permitida.

## Equivalencia con SQL Server

- `CREATE ROLE`: se modela creando una entrada en `ROLES`.
- `GRANT`: agregar la acción a `permissions` del rol.
- `DENY`: no incluir la acción en el rol (o removerla).

## Uso en rutas/API

```ts
import { requirePermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  requirePermission(session.role, "tickets.select");
  // continuar...
}
```

## Validación de entrada

- Formularios y JSON pasan por esquemas Zod.
- SQL se ejecuta con parámetros `?` para evitar inyección.
- Hashing de contraseñas con bcrypt (solo en servidor).

## Datos sensibles

- Credenciales en `.env`, nunca en cliente.
- `NEXTAUTH_SECRET` reservado para integrar autenticación completa si se requiere.
