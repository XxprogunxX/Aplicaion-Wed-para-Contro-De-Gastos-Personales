# Guía completa: seguridad, autenticación y autorización

Documentación unificada del backend **Control de Gastos Personales** para equipos de desarrollo y QA. Complementa los documentos detallados enlazados al final.

---

## 1. Objetivos de seguridad

1. **Autenticación**: solo clientes con JWT válido y no expirado acceden a rutas privadas.
2. **Autorización (RBAC)**: rutas administrativas requieren rol `admin`.
3. **Respuestas controladas**: errores de middleware sin detalles internos (`Unauthorized` / `Forbidden`).
4. **Tokens de vida limitada**: JWT con `exp`; secreto obligatorio fuerte en producción.

---

## 2. Flujo resumido

```
Cliente                          Backend
   |                                |
   |-- POST /login o /api/auth/login ->  Valida credenciales
   |<-------------------------------   JWT (exp ~12h) + datos usuario
   |                                |
   |-- GET /perfil + Bearer JWT ---->  verifyToken → req.user
   |<-------------------------------   200 + datos
   |                                |
   |-- GET /admin/usuarios -------->  verifyToken + authorizeRole('admin')
   |<-------------------------------   200 | 401 | 403
```

---

## 3. JWT (tokens)

| Aspecto | Implementación |
|---------|----------------|
| Emisión | `authController.issueToken()` — claims: `id`, `sub`, `email`, `username`, `role`. |
| Duración | `expiresIn: '12h'` (jsonwebtoken). |
| Verificación | `middleware/authMiddleware.js` → `jwt.verify(secret)` (rechaza expirados y firmas inválidas). |
| Secreto | `config/jwtEnv.js` — `getJwtSecret()`; `assertProductionJwtSecret()` en `src/index.js` si `NODE_ENV=production`. |

**Variable de entorno:** `JWT_SECRET` (obligatorio en producción; no usar el valor por defecto de desarrollo).

---

## 4. Middlewares

| Nombre en código | Archivo | Uso |
|------------------|---------|-----|
| `verifyToken` | `authMiddleware.js` | Cabecera `Authorization: Bearer <token>`. Asigna `req.user = { id, email, role, username? }`. |
| `authorizeRole(...)` | `roleMiddleware.js` | Lista de roles permitidos (`'admin'`, `['admin','user']`, etc.). |
| Default `require('./middleware/auth')` | `auth.js` | Alias de `verifyToken` para rutas legadas bajo `/api/*`. |

### Respuestas HTTP del middleware

| Caso | Código | Cuerpo |
|------|--------|--------|
| Sin token, token vacío, JWT inválido o expirado | **401** | `{ "error": "Unauthorized" }` |
| Token válido pero rol no autorizado | **403** | `{ "error": "Forbidden" }` |

Los errores de **negocio** (login fallido, validación de formulario) siguen el formato del controlador: `{ "error": true, "message": "...", "status": N }`.

---

## 5. Mapa de rutas

### 5.1 Especificación en raíz del servidor

| Método | Ruta | Acceso | Respuesta si se deniega |
|--------|------|--------|-------------------------|
| POST | `/login` | Público | — |
| POST | `/registro` | Público | — |
| GET | `/perfil` | Usuario autenticado (`user` o `admin`) | **401** |
| GET | `/historial` | Usuario autenticado | **401** |
| GET | `/admin/usuarios` | Solo `admin` | **401** sin token, **403** si rol `user` |
| DELETE | `/admin/usuarios/:id` | Solo `admin` | **401** / **403** |
| POST | `/admin/config` | Solo `admin` | **401** / **403** |

### 5.2 API de compatibilidad (cliente actual)

| Prefijo | Ejemplos |
|---------|----------|
| `/api/auth/*` | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/profile`, etc. |
| `/api/gastos`, `/api/categorias`, … | Protegidas con el mismo `verifyToken` vía `auth` middleware. |

### 5.3 Orden de montaje en `src/index.js`

1. Rutas públicas raíz: `rbacPublicRoutes` (`/login`, `/registro`).
2. Rutas privadas raíz: `rbacProtectedRoutes` (`/perfil`, `/historial`) con `verifyToken` solo en esas rutas.
3. Admin: `app.use('/admin', verifyToken, authorizeRole('admin'), adminRbacRoutes)`.
4. `app.use('/api/auth', authRoutes)`.
5. Resto de API con `authMiddleware`.

---

## 6. Usuarios de prueba (modo local sin Supabase)

| Email | Contraseña | Rol |
|-------|------------|-----|
| `demo@gastos.app` | `123456` | `user` |
| `admin@gastos.app` | `admin123` | `admin` |

Los usuarios demo **no** pueden eliminarse con `DELETE /admin/usuarios/:id` (respuesta **403**).

---

## 7. Archivos fuente relevantes

```
src/
  config/jwtEnv.js
  middleware/authMiddleware.js
  middleware/roleMiddleware.js
  middleware/auth.js
  routes/rbacPublicRoutes.js
  routes/rbacProtectedRoutes.js
  routes/adminRbacRoutes.js
  routes/authRoutes.js
  controllers/authController.js
  controllers/rbacSpecController.js
  controllers/adminRbacController.js
  index.js
tests/
  rbac-specification.test.js    # P1–P11
  auth.test.js
  auth-middleware.test.js
```

---

## 8. QA y evidencias

| Actividad | Dónde |
|-----------|--------|
| Matriz **P1–P11**, ejemplos cURL | [QA-RBAC-P1-P11.md](./QA-RBAC-P1-P11.md) |
| Tests automatizados | `npm test` — suite `tests/rbac-specification.test.js` |

---

## 9. Frontend: tokens y accesibilidad

El backend no renderiza la UI; el cumplimiento de **mensajes accesibles** en login y formularios está descrito en:

- [TOKENS-Y-MENSAJES-ACCESIBLES.md](./TOKENS-Y-MENSAJES-ACCESIBLES.md) (proyecto `frontend/`).

Incluye: `exp` en cliente, `localStorage`, `aria-live`, `role="alert"`, `getSafeLoginErrorMessage`, etc.

---

## 10. Documentación relacionada (profundidad)

| Tema | Archivo |
|------|---------|
| RBAC técnico detallado | [RBAC-AUTENTICACION.md](./RBAC-AUTENTICACION.md) |
| Pruebas P1–P11 | [QA-RBAC-P1-P11.md](./QA-RBAC-P1-P11.md) |
| Tokens + UI accesible | [TOKENS-Y-MENSAJES-ACCESIBLES.md](./TOKENS-Y-MENSAJES-ACCESIBLES.md) |
| Índice de esta carpeta | [README.md](./README.md) |

---

*Última revisión: alineada con `backend/src` (middlewares RBAC y rutas raíz).*
