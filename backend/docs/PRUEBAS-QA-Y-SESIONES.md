# Pruebas QA y tests de sesión (integración real)

Este documento describe las **pruebas de integración** del backend que ejercitan la API **sin mocks** de controladores: autenticación real, cookies HttpOnly, JWT por sesión, tabla `sessions` (o almacenamiento en memoria), Supabase y Redis cuando están configurados.

Para el diseño de auth y variables de entorno del producto, ver [AUTENTICACION-Y-SESIONES.md](./AUTENTICACION-Y-SESIONES.md).

---

## Objetivo

| Tipo | Qué valida |
|------|------------|
| **`npm run test:qa`** | Jest carga la aplicación Express **in-process** (misma instancia que producción en código) y ejecuta peticiones HTTP reales vía Supertest. |
| **`npm run qa:smoke`** | Cliente HTTP (`fetch`) contra un **servidor ya levantado** (local, staging o producción), útil en pipelines o comprobaciones manuales. |

No sustituyen los tests unitarios (`npm test`): esos usan mocks donde aplica y **excluyen** la carpeta `tests/qa/`.

---

## Requisitos previos

1. **`.env`** en la raíz del backend, idéntico al que usarías con `npm start`.
2. **Con Supabase** (`SUPABASE_URL` + clave en `.env`):
   - Tabla **`sessions`** según el esquema descrito en [AUTENTICACION-Y-SESIONES.md](./AUTENTICACION-Y-SESIONES.md).
   - Usuario de prueba dedicado y variables:
     - `QA_TEST_EMAIL`
     - `QA_TEST_PASSWORD`
3. **Sin Supabase** (solo desarrollo local): las suites usan el usuario demo **`demo@gastos.app`** / **`123456`** (misma lógica que el servidor).
4. **Node.js** 18 o superior para `npm run qa:smoke` (usa `fetch` nativo).

Si Supabase está configurado pero faltan `QA_TEST_EMAIL` / `QA_TEST_PASSWORD`, los bloques que requieren credenciales se **omiten** (`describe.skip`) con un mensaje explícito; el test de **`/health`** sigue ejecutándose.

---

## Comandos

```bash
cd backend

# Suite QA (Jest, in-process)
npm run test:qa

# Tests unitarios (sin QA)
npm test
```

**Smoke HTTP** (el API debe estar **en marcha** en otra terminal o ser una URL remota; el script **no** arranca el servidor):

```bash
# Terminal 1 (backend)
npm start

# Terminal 2 — por defecto: http://127.0.0.1:3000
npm run qa:smoke
```

Si ves `ECONNREFUSED`, el puerto no tiene proceso escuchando: arranca el API o define `QA_BASE_URL` al host/puerto correcto. Para probar sin servidor HTTP, usa **`npm run test:qa`** (Jest in-process).

```powershell
# PowerShell — URL y credenciales explícitas
$env:QA_BASE_URL = "https://api.tu-dominio.com"
$env:QA_TEST_EMAIL = "qa@tu-dominio.com"
$env:QA_TEST_PASSWORD = "..."
npm run qa:smoke
```

---

## Configuración de Jest

| Archivo | Rol |
|---------|-----|
| `jest.config.js` | Tests habituales; **`testPathIgnorePatterns`** incluye `/tests/qa/` para no mezclar con CI rápido. |
| `jest.config.qa.js` | Solo `tests/qa/**/*.test.js`, `setupFilesAfterEnv` → `tests/qa/jest.qa.setup.js` (carga `.env`), timeout 45s, un worker, `forceExit` para evitar handles colgados. |
| `tests/qa/jest.qa.setup.js` | `dotenv` + `QA_RUN=1`. |

---

## Archivos de la suite QA

| Ruta | Descripción |
|------|-------------|
| `tests/qa/real-api.integration.test.js` | Health, login (éxito/error), cookie HttpOnly, perfil, gastos, categorías, logout, revocación, Bearer cuando el body devuelve token. |
| `tests/qa/sessions.integration.test.js` | **Sesión**: claims del JWT (`sid`, `jti`, `sub`, `exp`), `sid === jti`, sesión distinta por login, logout + login nuevo, cookie vs Bearer, dos requests seguidas. Opcional: fila en Supabase. |
| `tests/qa/qaHelpers.js` | Resolución de credenciales QA, extracción de cabecera `Cookie` y JWT desde body o cookie (`extractSessionJwtFromLoginResponse`). |
| `scripts/qa/http-smoke.mjs` | Script de smoke contra `QA_BASE_URL`; valida flujo básico + payload de sesión en el JWT y segundo login con otro `sid`. |

---

## Detalle: tests de sesión (`sessions.integration.test.js`)

- El token (desde `data.token` o decodificando la cookie de sesión) debe decodificarse como JWT con **`sub`**, **`sid`**, **`jti`**, **`exp`** en el futuro.
- En el modelo actual del backend, **`sid` y `jti` coinciden** (identificador único de la fila `sessions`).
- Dos **POST /api/auth/login** consecutivos con el mismo usuario deben generar **dos `sid` distintos**.
- Tras **POST /api/auth/logout**, la cookie y el JWT anteriores **no** deben autorizar **GET /api/gastos**; un nuevo login **sí**.
- Con **`AUTH_RETURN_TOKEN_BODY`** distinto de `false`, se comprueba que **cookie** y **Bearer** autorizan el mismo recurso para la misma sesión.
- Dos peticiones autenticadas seguidas (p. ej. gastos + perfil) responden **200** (sesión activa, `last_active` actualizable).

### Verificación opcional en base de datos (Supabase)

Si defines:

```env
QA_VERIFY_SESSION_ROW=1
```

y el cliente Supabase del backend puede leer la tabla **`sessions`**, se ejecuta un caso adicional:

1. Tras login, se consulta la fila cuyo **`id`** coincide con **`sid`** del JWT: debe existir, **`is_active: true`**, **`expires_at`** en el futuro.
2. Tras logout, la misma fila debe tener **`is_active: false`**.

Sin esta variable, ese bloque no se registra en Jest.

---

## Detalle: smoke HTTP (`qa:smoke`)

Secuencia aproximada:

1. `GET /health`
2. Login con contraseña incorrecta → **401**
3. Login correcto → usuario en JSON, **Set-Cookie**, extracción del JWT
4. Comprobación de payload: `sid`, `jti`, `sub`, igualdad `sid === jti`
5. Segundo login → **otro `sid`**
6. `GET /api/auth/profile` y `GET /api/gastos` con cookie
7. `POST /api/auth/logout`
8. `GET /api/gastos` con la cookie antigua → **401**

Variables relevantes: `QA_BASE_URL`, `QA_TEST_EMAIL`, `QA_TEST_PASSWORD`, `AUTH_COOKIE_NAME` (si cambiaste el nombre de la cookie), mismas reglas de Supabase que arriba.

---

## Variables de entorno (resumen QA)

| Variable | Obligatoriedad | Uso |
|----------|----------------|-----|
| `QA_TEST_EMAIL` | Con Supabase en `.env` | Usuario real de prueba. |
| `QA_TEST_PASSWORD` | Con Supabase en `.env` | Contraseña del usuario QA. |
| `QA_BASE_URL` | Solo smoke | URL base del API (default `http://127.0.0.1:3000`). |
| `QA_VERIFY_SESSION_ROW` | Opcional | `1` para tests que leen `sessions` en Supabase. |
| `AUTH_RETURN_TOKEN_BODY` | Opcional | Si es `false`, varios tests que dependen del token en JSON se adaptan o comprueban ese modo. |
| `AUTH_COOKIE_NAME` | Opcional | Debe coincidir con el servidor (smoke y helpers). |
| `REDIS_URL` | Opcional | Si está definida, entran en juego blacklist y rate limits reales; un exceso de intentos puede devolver **429** en login. |

Ejemplos comentados también en `.env.example`.

---

## Integración en CI/CD

1. Instalar dependencias y copiar secretos (sin commitear `.env`):
   - `JWT_SECRET`, Supabase, opcional `REDIS_URL`, `QA_TEST_EMAIL`, `QA_TEST_PASSWORD`.
2. Opcional: levantar Redis y aplicar migraciones Supabase (tabla `sessions`).
3. Ejecutar **`npm run test:qa`** (no hace falta servidor aparte).
4. Opcional segundo job: arrancar `npm start` en background, esperar a `/health`, ejecutar **`npm run qa:smoke`** con `QA_BASE_URL` apuntando al proceso.

---

## Solución de problemas

| Síntoma | Posible causa |
|---------|----------------|
| **503** en login durante QA | Fallo al insertar en `sessions` (tabla inexistente o RLS sin permisos para el rol del servidor). |
| **429** en login | Rate limit en Redis (`auth:rl:login-*`); esperar la ventana o limpiar claves en desarrollo. |
| Suite auth **skipped** | Supabase activo pero sin `QA_TEST_EMAIL` / `QA_TEST_PASSWORD`. |
| Smoke **falla conexión** | API no arrancada o `QA_BASE_URL` incorrecta. |
| Jest **no termina** / aviso de handles | Ya se usa `forceExit` en `jest.config.qa.js`; `disconnectRedis()` en `afterAll` cierra Redis si se abrió. |

---

## Referencias cruzadas

- [AUTENTICACION-Y-SESIONES.md](./AUTENTICACION-Y-SESIONES.md) — arquitectura de auth, cookies, Redis, tabla `sessions`.
- `tests/qa/README.md` — resumen breve en el repo (duplica parte de este documento).
- [README.md](../README.md) — tabla de scripts `test`, `test:qa`, `qa:smoke`.

---

*Documento específico para pruebas QA y de sesión. Mantener alineado con `tests/qa/` y `scripts/qa/`.*
