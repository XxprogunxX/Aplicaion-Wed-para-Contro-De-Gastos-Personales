# Documentación del backend

Índice de guías técnicas y de QA en esta carpeta (`backend/docs/`).

| Documento | Contenido |
|-----------|-----------|
| **[GUIA-COMPLETA-SEGURIDAD-Y-AUTH.md](./GUIA-COMPLETA-SEGURIDAD-Y-AUTH.md)** | **Guía principal**: visión general, flujos, variables de entorno, tablas de rutas, enlaces al resto. |
| [RBAC-AUTENTICACION.md](./RBAC-AUTENTICACION.md) | Middlewares `verifyToken` / `authorizeRole`, rutas raíz (`/login`, `/perfil`, `/admin/*`), controladores. |
| [QA-RBAC-P1-P11.md](./QA-RBAC-P1-P11.md) | Pruebas manuales (cURL) y matriz **P1–P11**; comando Jest. |
| [TOKENS-Y-MENSAJES-ACCESIBLES.md](./TOKENS-Y-MENSAJES-ACCESIBLES.md) | Cumplimiento: expiración JWT, `JWT_SECRET`, mensajes accesibles en el **frontend** (login, `Input`, SR). |

Otras referencias:

- README del backend: [../README.md](../README.md) (instalación, Docker, variables).
