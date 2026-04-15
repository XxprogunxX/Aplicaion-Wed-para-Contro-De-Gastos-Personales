# Autenticación JWT y RBAC — arquitectura técnica

> **Guía general:** [GUIA-COMPLETA-SEGURIDAD-Y-AUTH.md](./GUIA-COMPLETA-SEGURIDAD-Y-AUTH.md) · **QA P1–P11:** [QA-RBAC-P1-P11.md](./QA-RBAC-P1-P11.md) · **Índice:** [README.md](./README.md)

---

## Middlewares

| Archivo | Export | Función |
|---------|--------|---------|
| `src/middleware/authMiddleware.js` | `verifyToken` (default) | Valida `Authorization: Bearer <JWT>`, firma y **exp** (`jwt.verify`). Asigna `req.user = { id, email, role, username? }`. |
| `src/middleware/roleMiddleware.js` | `authorizeRole(rolesPermitidos)` | Tras `verifyToken`, comprueba que `req.user.role` esté en la lista. |
| `src/middleware/auth.js` | default | Reexporta `authMiddleware` para rutas existentes bajo `/api/*`. |

### Respuestas de error (sin fugas)

| Situación | HTTP | Cuerpo JSON |
|-----------|------|-------------|
| Sin token, token mal formado, firma inválida, expirado | 401 | `{ "error": "Unauthorized" }` |
| Autenticado pero rol no permitido | 403 | `{ "error": "Forbidden" }` |

Los errores de **negocio** en login/registro (credenciales, validación) siguen usando el formato `{ error: true, message, status }` del controlador.

## Rutas según especificación (raíz del servidor)

| Método | Ruta | Público | Roles | Middleware |
|--------|------|---------|-------|------------|
| POST | `/login` | Sí | — | — |
| POST | `/registro` | Sí | — | — |
| GET | `/perfil` | No | user, admin | `verifyToken` |
| GET | `/historial` | No | user, admin | `verifyToken` |
| GET | `/admin/usuarios` | No | admin | `verifyToken` + `authorizeRole('admin')` |
| DELETE | `/admin/usuarios/:id` | No | admin | idem |
| POST | `/admin/config` | No | admin | idem |

Montaje en `src/index.js` (orden relevante):

1. `app.use('/', rbacPublicRoutes)` — `/login`, `/registro`
2. `app.use('/', rbacProtectedRoutes)` — `/perfil`, `/historial`
3. `app.use('/admin', verifyToken, authorizeRole('admin'), adminRbacRoutes)`
4. `app.use('/api/auth', authRoutes)` — compatibilidad (`/api/auth/login`, etc.)
5. Rutas `/api/gastos`, etc. — `authMiddleware` (= `verifyToken`)

## Controladores

- `rbacSpecController.js` — `GET /perfil`, `GET /historial`
- `adminRbacController.js` — usuarios y config admin (stub / memoria local)
- `authController.js` — login, registro, helpers `listLocalUsersSanitized`, `removeLocalUserById`

## Usuarios demo (sin Supabase)

| Email | Contraseña | Rol |
|-------|--------------|-----|
| `demo@gastos.app` | `123456` | `user` |
| `admin@gastos.app` | `admin123` | `admin` |

Los IDs demo y admin **no** se pueden borrar por `DELETE /admin/usuarios/:id`.

## JWT

- Emisión: `issueToken` en `authController` con `expiresIn: '12h'` y claims `id`, `email`, `username`, `role`.
- Secreto: `config/jwtEnv.js` — en producción `assertProductionJwtSecret()` en `index.js`.

## Pruebas automatizadas

- `tests/rbac-specification.test.js` — casos **P1–P11**.
- `tests/auth.test.js`, `tests/auth-middleware.test.js` — 401 en API protegida.

## Documentación QA

Ver [QA-RBAC-P1-P11.md](./QA-RBAC-P1-P11.md).
