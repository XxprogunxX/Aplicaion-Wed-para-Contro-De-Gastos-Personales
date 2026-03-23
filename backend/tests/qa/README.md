# Pruebas QA (integración real)

Resumen operativo. **Documentación completa:** [docs/PRUEBAS-QA-Y-SESIONES.md](../../docs/PRUEBAS-QA-Y-SESIONES.md).

Estas pruebas **no simulan** controladores: cargan la app Express real y ejecutan login, Supabase o fallback en memoria, cookies, JWT y logout.

## Requisitos

1. **`.env`** en la raíz del backend.
2. Con **Supabase**: tabla **`sessions`** (ver [AUTENTICACION-Y-SESIONES.md](../../docs/AUTENTICACION-Y-SESIONES.md)), `QA_TEST_EMAIL`, `QA_TEST_PASSWORD`.
3. Sin Supabase: **`demo@gastos.app`** / **`123456`**.

## Comandos

```bash
npm run test:qa
npm run qa:smoke   # requiere API en marcha; ver doc principal
```

## Archivos

| Archivo | Enfoque |
|---------|---------|
| `real-api.integration.test.js` | Health, login, perfil, gastos, categorías, logout, Bearer. |
| `sessions.integration.test.js` | JWT `sid`/`jti`, revocación, cookie/Bearer, opcional `QA_VERIFY_SESSION_ROW`. |
| `qaHelpers.js` | Credenciales y extracción cookie/JWT. |

## Notas

- Excluidas de `npm test` (`jest.config.js`).
- Rate limit Redis puede devolver **429** si hay muchos logins seguidos.
