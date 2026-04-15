# Tokens con expiración y mensajes accesibles — cumplimiento

> **Índice de documentación:** [README.md](./README.md) · **Guía unificada (backend):** [GUIA-COMPLETA-SEGURIDAD-Y-AUTH.md](./GUIA-COMPLETA-SEGURIDAD-Y-AUTH.md) · **RBAC:** [RBAC-AUTENTICACION.md](./RBAC-AUTENTICACION.md)

Este documento cubre el **frontend** (mensajes accesibles) y el encaje con **JWT** del backend. La autorización por rol y rutas `/admin` están en la guía RBAC.

---

Resumen de cómo el proyecto cubre los requisitos **tokens seguros con expiración** y **mensajes accesibles**, y recomendaciones.

## 1. Tokens seguros con expiración

| Requisito | Estado | Detalle en código |
|-----------|--------|---------------------|
| JWT con tiempo de vida limitado | Cumple | `issueToken` en `authController.js` usa `expiresIn: '12h'` (jsonwebtoken incluye `exp` en el payload). |
| Validación de expiración en API | Cumple | `jwt.verify()` en `middleware/auth.js` rechaza tokens caducados automáticamente. |
| Secreto fuerte en producción | Cumple | `config/jwtEnv.js`: en `NODE_ENV=production` el arranque falla si `JWT_SECRET` falta o sigue siendo el valor por defecto de desarrollo. |
| Secreto unificado | Cumple | `getJwtSecret()` usado al firmar y al verificar. |
| Cliente coherente con `exp` | Cumple (frontend) | `lib/session.ts`: `isTokenExpired`, `buildStoredSession` descarta sesiones expiradas; alineado con el `exp` del JWT. |

### Limitaciones / riesgos a conocer

- **Almacenamiento del token en el navegador**: el frontend guarda el JWT en `localStorage` para enviarlo como `Authorization: Bearer`. Eso es habitual pero **expone el token a scripts** si hubiera XSS. Mitigación fuerte: cookie **HttpOnly** (servidor) + CSP; valorar en evoluciones del backend.
- **Rotación / revocación**: no hay lista de revocación en esta versión simplificada; la expiración es la principal limitación temporal.

---

## 2. Mensajes accesibles (UI)

| Requisito | Estado | Detalle |
|-----------|--------|---------|
| Errores de formulario comprensibles | Cumple | Login usa `getSafeLoginErrorMessage()` para no mostrar textos crudos del backend. |
| Anuncio para lectores de pantalla | Cumple | Bloque `aria-live="polite"` + `role="status"` (sr-only) con estado de carga y error seguro. |
| Error visible e importante | Cumple | `<p role="alert">` con el mismo texto seguro que el resumen para SR. |
| Campos con errores | Cumple | `Input`: `aria-invalid`, `aria-describedby` enlazado al párrafo de error, etiquetas con `htmlFor`. |
| Mensaje de error de campo | Cumple | Párrafo de error con `role="alert"` y `aria-live="polite"` (compatible con patrones WCAG para errores en formularios). |
| Idioma de página | Cumple | `layout.tsx`: `<html lang="es">`. |

### Toasts (Sileo)

Los toasts de éxito/error (`useApi`, `useSileoToast`) dependen del componente **Toaster** de la librería. Conviene validar con lectores de pantalla reales; si el contenedor no expone `role="status"`/`aria-live`, valorar envolver o sustituir por un sistema con regiones vivas explícitas.

---

## Cambios recientes relacionados

- `backend/src/config/jwtEnv.js` — validación de `JWT_SECRET` en producción.
- `frontend` — login muestra solo mensajes pasados por `getSafeLoginErrorMessage`; `Input` usa `role="alert"` en errores de validación.

---

*Revisión alineada con el código actual del repositorio.*
