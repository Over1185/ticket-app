# Seguridad - Roles y Permisos

## Sistema de Permisos

Aunque Turso/SQLite no soporta roles nativos como SQL Server, implementamos un sistema de permisos basado en aplicación que es más flexible y centralizado.

### Definición de Roles

```typescript
// src/lib/auth/permissions.ts

type Role = 'cliente' | 'operador' | 'admin'

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  'cliente': [
    'usuarios.select_self',        // Ver solo su propio usuario
    'tickets.create',              // Crear tickets
    'tickets.select_own',          // Ver solo sus tickets
    'interacciones.select_own',    // Ver solo sus comentarios
    'interacciones.create_own',    // Crear comentarios en propios tickets
  ],
  
  'operador': [
    'usuarios.select',             // Ver todos los usuarios
    'tickets.select',              // Ver todos los tickets
    'tickets.update',              // Cambiar estado, prioridad
    'tickets.assign',              // Asignar a otro operador
    'interacciones.select',        // Ver todas las interacciones
    'interacciones.create',        // Crear comentarios públicos
    'interacciones.create_internal', // Crear comentarios internos
  ],
  
  'admin': [
    '*'                            // Acceso completo
  ]
}

function hasPermission(userRole: Role, action: string): boolean {
  if (userRole === 'admin') return true
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes(action) || permissions.includes('*')
}
```

### Equivalencia con SQL Server Roles

| Concepto SQL Server | Implementación en Turso | Ubicación |
|-------------------|------------------------|-----------|
| CREATE ROLE | Constrain check en tabla usuarios | `/db/schema.sql` |
| GRANT SELECT | hasPermission('operador', 'tickets.select') | `/lib/auth/permissions.ts` |
| DENY DELETE | no se expone acción en Server Actions | `/app/actions/tickets.ts` |
| EXECUTE procedure | enqueueTask en Redis | `/lib/redis/queue.ts` |

## Implementación en Rutas API

### Validación en Server Actions

```typescript
// src/app/actions/tickets.ts

'use server'

export async function actualizarTicket(ticketId: number, usuarioId: number, ...) {
  // 1. Validar que el usuario tenga permiso
  const usuario = await obtenerUsuario(usuarioId)
  
  if (!hasPermission(usuario.rol, 'tickets.update')) {
    throw new Error('No tienes permisos para actualizar tickets')
  }
  
  // 2. Si es cliente, validar que sea su propio ticket
  if (usuario.rol === 'cliente') {
    const ticket = await obtenerTicket(ticketId)
    if (ticket.usuario_id !== usuarioId) {
      throw new Error('No puedes actualizar tickets de otros usuarios')
    }
  }
  
  // 3. Ejecutar acción
  await ejecutarActualizacion(...)
}
```

### Validación en API Routes

```typescript
// src/app/api/tickets/route.ts

export async function GET(request: NextRequest) {
  const usuarioId = request.headers.get('x-user-id') // De sesión
  const usuario = await obtenerUsuario(usuarioId)
  
  if (!hasPermission(usuario.rol, 'tickets.select')) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }
  
  // Retornar tickets según rol
  if (usuario.rol === 'cliente') {
    return await listarTicketsDelUsuario(usuarioId)
  }
  return await listarTickets()
}
```

## Flujo de Seguridad

### Autenticación (Login)

```
1. Usuario envía email + contraseña → loginUsuario()
2. Buscar usuario por email en BD
3. Comparar contraseña con hash usando bcryptjs.compare()
4. Si válido:
   - Cachear usuario en Redis
   - Retornar usuario + rol (no retornar hash)
5. Si inválido:
   - Retornar error genérico (sin revelar que email existe)
```

### Autorización (Acción)

```
1. Server Action recibe solicitud de usuario
2. Validar sesión/usuario (obtener de cookies/headers)
3. Obtener rol del usuario
4. Verificar hasPermission(rol, action)
5. Si no tiene permiso → error 403
6. Si tiene permiso:
   - Validar inputs con Zod
   - Ejecutar operación
   - Invalidar cachés afectados
```

## Mejores Prácticas Implementadas

### 1. Never Trust Client Input

```typescript
// ✓ BIEN: Validar con Zod
const schema = z.object({
  titulo: z.string().min(5),
  // ...
})
const datos = schema.parse(input) // Lanzará error si invalido

// ✗ MAL: Pasar input directo
db.execute(`UPDATE tickets SET titulo = '${input.titulo}'`)
```

### 2. Prepared Statements

```typescript
// ✓ BIEN: Parámetros separados
await query('SELECT * FROM usuarios WHERE email = ?', [email])

// ✗ MAL: String interpolation
await query(`SELECT * FROM usuarios WHERE email = '${email}'`)
```

### 3. Password Hashing

```typescript
// ✓ BIEN: Usar bcryptjs
const passwordHash = await hashPassword(password)
const isValid = await verifyPassword(password, passwordHash)

// ✗ MAL: Guardar texto plano o simple hash
const hash = sha256(password) // Vulnerable a rainbow tables
```

### 4. Información Sensible

```typescript
// ✓ BIEN: No retornar información sensible
return { id, nombre, email, rol } // Sin password_hash

// ✗ MAL: Retornar todo
return usuario // Incluye password_hash
```

### 5. Errores Genéricos

```typescript
// ✓ BIEN: No revelar información
return { error: 'Email o contraseña inválidos' }

// ✗ MAL: Información específica
if (!user) return { error: 'Usuario no encontrado' }
```

## Escalado a Autenticación Real

Para producción, implementar:

### JWT (JSON Web Tokens)

```typescript
// Instalar: npm install jsonwebtoken
import jwt from 'jsonwebtoken'

const token = jwt.sign(
  { userId: usuario.id, rol: usuario.rol },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
)

// Verificar en middleware
const decoded = jwt.verify(token, process.env.JWT_SECRET)
```

### NextAuth.js (Recomendado)

```typescript
// Instalar: npm install next-auth
// Configurar: /app/api/auth/[...nextauth]/route.ts

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const usuario = await loginUsuario(credentials)
        return usuario ? { ...usuario } : null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.rol = user.rol
      return token
    },
    async session({ session, token }) {
      session.usuario.rol = token.rol
      return session
    }
  }
}
```

## Auditoría y Logging

Agregar al sistema:

```typescript
// lib/audit/logger.ts

interface AuditLog {
  usuarioId: number
  accion: string
  recurso: string
  resourceoId: number
  resultado: 'éxito' | 'error' | 'denegado'
  timestamp: Date
  detalles?: string
}

async function logAccion(
  usuarioId: number,
  accion: string,
  recurso: string,
  recursoId: number,
  resultado: 'éxito' | 'error' | 'denegado'
) {
  // Insertar en tabla de auditoría
  // Útil para detectar intentos de acceso no autorizado
}
```

Ejemplo de auditoría:

```
2024-12-14 10:30:45 | usuario=1 | acción=update_ticket | recurso=tickets | id=5 | resultado=éxito
2024-12-14 10:31:02 | usuario=2 | acción=update_ticket | recurso=tickets | id=5 | resultado=denegado (no propietario)
2024-12-14 10:31:15 | usuario=4 | acción=delete_user | recurso=usuarios | id=1 | resultado=denegado (sin permiso)
```

## Checklist de Seguridad

- [x] Validación de inputs con Zod
- [x] Prepared statements en BD
- [x] Hash de contraseñas con bcryptjs
- [x] Sistema de roles y permisos
- [x] Información no sensible en respuestas
- [x] Errores genéricos para autenticación
- [ ] JWT o NextAuth para tokens persistentes
- [ ] Rate limiting en endpoints
- [ ] Logs de auditoría
- [ ] HTTPS/TLS obligatorio
- [ ] CORS configurado
- [ ] CSRF tokens en forms
- [ ] XSS protection
- [ ] SQL injection prevention (ya implementado)
