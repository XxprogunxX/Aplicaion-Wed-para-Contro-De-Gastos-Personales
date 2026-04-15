# QA — Pruebas RBAC (P1–P11)

> **Guía general:** [GUIA-COMPLETA-SEGURIDAD-Y-AUTH.md](./GUIA-COMPLETA-SEGURIDAD-Y-AUTH.md) · **Arquitectura RBAC:** [RBAC-AUTENTICACION.md](./RBAC-AUTENTICACION.md) · **Índice:** [README.md](./README.md)

---

Base URL de ejemplo: `http://localhost:3000`. Sustituye `TOKEN_USER` y `TOKEN_ADMIN` por JWT válidos (login en `/login` o `/api/auth/login`).

## Matriz de pruebas

| ID | Escenario | Petición | Esperado |
|----|-----------|----------|----------|
| **P1** | Acceso permitido (login público) | `POST /login` con credenciales válidas | **200**, `data.token` |
| **P2** | Registro público | `POST /registro` con body `{ username, email, password }` | **201** o error de negocio (409/400), nunca 401 por auth |
| **P3** | Sin token | `GET /perfil` sin header | **401** `{ "error": "Unauthorized" }` |
| **P4** | Token inválido | `GET /perfil` + `Authorization: Bearer xyz` | **401** `{ "error": "Unauthorized" }` |
| **P5** | Perfil con token usuario | `GET /perfil` + Bearer usuario | **200**, `data.id`, `data.role` |
| **P6** | Historial con token | `GET /historial` + Bearer usuario o admin | **200** |
| **P7** | Admin sin token | `GET /admin/usuarios` sin header | **401** `{ "error": "Unauthorized" }` |
| **P8** | Admin con rol user | `GET /admin/usuarios` + Bearer **user** | **403** `{ "error": "Forbidden" }` |
| **P9** | Admin con rol admin | `GET /admin/usuarios` + Bearer **admin** | **200** |
| **P10** | DELETE admin con rol user | `DELETE /admin/usuarios/:id` + Bearer user | **403** |
| **P11** | POST config con rol user | `POST /admin/config` + Bearer user | **403** |

## Ejemplos cURL

```bash
# P1 — Login
curl -s -X POST http://localhost:3000/login -H "Content-Type: application/json" \
  -d '{"email":"demo@gastos.app","password":"123456"}'

# P3 — Sin token
curl -s -o /dev/stderr -w "%{http_code}" http://localhost:3000/perfil
# Esperado: 401 y body {"error":"Unauthorized"}

# P5 — Con token (exporta TOKEN desde P1)
curl -s http://localhost:3000/perfil -H "Authorization: Bearer $TOKEN"

# P8 — Usuario normal a admin
curl -s -o /dev/stderr -w "%{http_code}" http://localhost:3000/admin/usuarios \
  -H "Authorization: Bearer $TOKEN_USER"
# Esperado: 403

# P9 — Admin
curl -s http://localhost:3000/admin/usuarios -H "Authorization: Bearer $TOKEN_ADMIN"
```

### Obtener tokens de prueba

```bash
# Usuario
TOKEN_USER=$(curl -s -X POST http://localhost:3000/login -H "Content-Type: application/json" \
  -d '{"email":"demo@gastos.app","password":"123456"}' | jq -r '.data.token')

# Admin
TOKEN_ADMIN=$(curl -s -X POST http://localhost:3000/login -H "Content-Type: application/json" \
  -d '{"email":"admin@gastos.app","password":"admin123"}' | jq -r '.data.token')
```

## Evidencias automatizadas

```bash
cd backend && npm test -- tests/rbac-specification.test.js
```

Todos los casos P1–P11 están cubiertos en `tests/rbac-specification.test.js`.
