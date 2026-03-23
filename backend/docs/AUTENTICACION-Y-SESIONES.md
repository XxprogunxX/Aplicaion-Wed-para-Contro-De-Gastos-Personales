# Autenticación y sesiones

Documentación del sistema de autenticación del backend (Express), integrado con **Supabase** (credenciales y tabla `sessions`), **JWT** por dispositivo, **cookie HttpOnly** y **Redis** (blacklist de tokens y rate limiting).

## Arquitectura (resumen)

```
Cliente                    Backend                         Servicios
  |                          |                                |
  |-- POST /api/auth/login ->|-- Supabase Auth (password)     |
  |                          |-- INSERT sessions               |
  |                          |-- JWT + Set-Cookie (HttpOnly)   |
  |<-------------------------|                                |
  |                          |                                |
  |-- API protegida -------->|-- Cookie o Bearer              |
  |                          |-- Verificar JWT                |
  |                          |-- Redis: blacklist + RL user   |
  |                          |-- Supabase: sesión activa      |
  |                          |-- UPDATE last_active           |
```

- **Un JWT por sesión/dispositivo**: el payload incluye identificador de sesión (`sid`) y `jti` (alineado con la fila en `sessions` para revocación vía Redis).
- **Prioridad de credenciales en peticiones protegidas**: primero la **cookie** configurada (`AUTH_COOKIE_NAME`, por defecto `session_token`), luego el header **`Authorization: Bearer <token>`**.

## Estructura de archivos

| Ruta | Rol |
|------|-----|
| `src/auth/login.js` | Handler `POST /api/auth/login` |
| `src/auth/logout.js` | Handler `POST /api/auth/logout` |
| `src/middleware/auth.js` | Autorización JWT + Redis + validación en `sessions` |
| `src/middleware/rateLimit.js` | Rate limits (login por IP/email, API por IP, helpers) |
| `src/lib/jwt.js` | Firma, verificación y extracción del token |
| `src/lib/sessions.js` | CRUD lógico de sesiones (Supabase o memoria en local sin Supabase) |
| `src/lib/redis.js` | Cliente Redis, blacklist y contadores de rate limit |
| `src/lib/supabase.js` | Helper `signInWithPassword` y reexport del cliente |
| `src/lib/authSession.js` | Crear sesión + cookie + JWT (compartido login/register) |
| `src/config/supabase.js` | Cliente Supabase global (ya existente) |

## Tabla `sessions` (Supabase)

Campos esperados por el código:

| Campo | Tipo sugerido | Descripción |
|-------|----------------|-------------|
| `id` | `uuid` (PK) | Identificador de la sesión (coincide con `sid` / `jti` en el JWT) |
| `user_id` | `uuid` (FK → `auth.users`) | Usuario propietario |
| `device_info` | `text` | User-Agent o texto enviado por el cliente (`device_info` en body) |
| `ip_address` | `text` | IP del cliente (considerar `trust proxy` detrás de balanceadores) |
| `created_at` | `timestamptz` | Creación |
| `expires_at` | `timestamptz` | Expiración de la sesión |
| `last_active` | `timestamptz` | Última actividad (se actualiza en cada request autenticado válido) |
| `is_active` | `boolean` | `false` tras logout u invalidación |

**SQL de ejemplo** (ajusta esquema y RLS según tu política de seguridad):

```sql
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_info text,
  ip_address text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_active timestamptz not null default now(),
  is_active boolean not null default true
);

create index sessions_user_active_idx
  on public.sessions (user_id)
  where is_active = true;
```

Para que el backend pueda insertar/actualizar filas sin depender de la sesión del usuario en el cliente, lo habitual es usar **`SUPABASE_SERVICE_ROLE_KEY`** en el servidor (nunca en el frontend) o políticas RLS explícitas para el rol que usa la API.

## Variables de entorno

### Obligatorias / críticas en producción

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Secreto fuerte para firmar JWT. En `NODE_ENV=production` no debe ser el valor por defecto de desarrollo. |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` o clave con permisos adecuados | Recomendado para escritura en `sessions` y operaciones admin de auth si las usas |

### Redis (opcional pero recomendado)

| Variable | Descripción |
|----------|-------------|
| `REDIS_URL` | URL de conexión (p. ej. `redis://localhost:6379`). Si no está definida, **no** se aplica rate limit ni blacklist en Redis; la API sigue funcionando. |

### JWT y cookie

| Variable | Default | Descripción |
|----------|---------|-------------|
| `JWT_ISSUER` | `gastos-personales-api` | Claim `iss` |
| `JWT_AUDIENCE` | `gastos-personales-clients` | Claim `aud` |
| `SESSION_TTL_SECONDS` | `43200` (12 h) | Duración de sesión y JWT (mínimo efectivo > 60 s en validación) |
| `AUTH_COOKIE_NAME` | `session_token` | Nombre de la cookie HttpOnly |
| `AUTH_RETURN_TOKEN_BODY` | `true` | Si es `false`, el login/register **no** incluyen `token` en el JSON (solo cookie). |

### CORS y proxy

| Variable | Descripción |
|----------|-------------|
| `CORS_ORIGIN` | Orígenes permitidos separados por comas (debe incluir el frontend si usas cookies entre orígenes). El servidor usa `credentials: true`. |
| `TRUST_PROXY_HOPS` | Saltos de proxy de confianza para `req.ip` / rate limit (default `1`). |

### Rate limiting (solo con `REDIS_URL`)

**Login** (`middleware/rateLimit.js`):

| Variable | Default | Significado |
|----------|---------|-------------|
| `RATE_LIMIT_LOGIN_IP_WINDOW_SEC` | `900` | Ventana (segundos) por IP en login |
| `RATE_LIMIT_LOGIN_IP_MAX` | `30` | Máximo de intentos por IP por ventana |
| `RATE_LIMIT_LOGIN_EMAIL_WINDOW_SEC` | `900` | Ventana por email (hash SHA-256) |
| `RATE_LIMIT_LOGIN_EMAIL_MAX` | `10` | Máximo por email por ventana |

**API global por IP** (montado en `src/index.js`):

| Variable | Default |
|----------|---------|
| `RATE_LIMIT_API_IP_WINDOW_SEC` | `60` |
| `RATE_LIMIT_API_IP_MAX` | `300` |

**Usuario autenticado** (`middleware/auth.js`):

| Variable | Default |
|----------|---------|
| `RATE_LIMIT_AUTH_USER_WINDOW_SEC` | `60` |
| `RATE_LIMIT_AUTH_USER_MAX` | `600` |

Respuesta **429** con cuerpo `{ error, message, status }`. En login también se envían cabeceras `X-RateLimit-Limit` y `X-RateLimit-Remaining` cuando Redis está activo.

### Compatibilidad y pruebas

| Variable | Descripción |
|----------|-------------|
| `AUTH_ALLOW_LEGACY_DEMO_TOKEN` | Si es `true`, acepta el token fijo de demo además del flujo normal (no usar en producción). En `NODE_ENV=test` el token demo de tests sigue habilitado por defecto. |

## Endpoints

### `POST /api/auth/login`

- **Body**: `{ "email": string, "password": string, "device_info"?: string }`
- **Orden de middlewares**: rate limit por IP → rate limit por email → handler.
- **Éxito (200)**: `{ error: false, message, data: { user, token? } }` y cookie HttpOnly.
- **Errores**: `400` validación; `401` credenciales inválidas (mensaje genérico); `429` rate limit; `503` si no se puede crear la sesión en base de datos.

### `POST /api/auth/register`

- Manejado en `authController`; tras crear el usuario también llama a `createAuthSession` (misma cookie y modelo de sesión que el login).

### `POST /api/auth/logout`

- Requiere **`authMiddleware`** previo (token válido en cookie o Bearer).
- **Éxito**: desactiva la fila en `sessions` (si aplica), añade `jti` a Redis hasta el TTL restante del JWT, borra la cookie.

### Rutas protegidas

Cualquier ruta montada con `authMiddleware` (p. ej. `/api/gastos`, `/api/auth/profile` con middleware, etc.) exige token válido, sesión activa y no expirada, y pasa las comprobaciones de Redis cuando están configuradas.

## Redis: claves usadas

| Patrón | Uso |
|--------|-----|
| `auth:blacklist:jti:<jti>` | Token revocado (TTL hasta expiración natural del JWT) |
| `auth:rl:login-ip:<ip>` | Rate limit login por IP |
| `auth:rl:login-email:email:<hash>` | Rate limit login por email |
| `auth:rl:api-ip:<ip>` | Rate limit general por IP |
| `auth:rl:authed:<userId>` | Rate limit por usuario autenticado |

## Seguridad (buenas prácticas)

1. **HTTPS en producción**: la cookie usa `Secure: true` cuando `NODE_ENV=production`.
2. **No filtrar detalles** de Supabase u orígenes internos en respuestas de login fallido.
3. **HttpOnly** evita lectura del token desde JavaScript; combina con `SameSite=Lax` (ajustable si en el futuro necesitas cross-site explícito).
4. **Revocación**: logout + blacklist acotada en el tiempo evita tokens reutilizados hasta que expiren.
5. **Secretos**: `JWT_SECRET` y `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor; nunca en el cliente.

## Frontend (integración breve)

- El cliente HTTP debe usar **`withCredentials: true`** (p. ej. Axios) para enviar la cookie en peticiones al dominio del API.
- `CORS_ORIGIN` debe listar el origen exacto del frontend (no `*` con credenciales).
- Si `AUTH_RETURN_TOKEN_BODY=false`, no habrá `token` en JSON: la sesión depende solo de la cookie (y opcionalmente de un proxy BFF que reenvíe la cookie).

## Modo sin Supabase

Si no hay variables de Supabase configuradas, el login puede usar el **usuario demo en memoria** (`demo@gastos.app` / contraseña según el código de ejemplo del proyecto) y las sesiones se guardan en un **Map en memoria** (solo desarrollo; no persiste entre reinicios).

## Referencia rápida de respuestas HTTP

| Código | Contexto típico |
|--------|------------------|
| `401` | Sin token, token inválido, sesión inactiva/expirada, token en blacklist |
| `429` | Rate limit (login, API por IP o usuario autenticado) |
| `503` | Error al persistir sesión tras login/register |

## Pruebas QA y de sesión

Las pruebas de integración real (Jest y smoke HTTP) tienen **documentación propia** en [PRUEBAS-QA-Y-SESIONES.md](./PRUEBAS-QA-Y-SESIONES.md): comandos, archivos, variables `QA_*`, verificación opcional en tabla `sessions` y uso en CI.

---

*Última revisión alineada con el código en `backend/src` (auth, middleware, lib).*
