# Checklist QA - Tokens Seguros & Mensajes Accesibles

## 🔐 Tokens Seguros con Expiración

### Tests Automatizados (Backend → `npm test`)
- [ ] ✅ Token JWT debe incluir campo `exp` con 12 horas
- [ ] ✅ `jwt.verify()` rechaza tokens expirados con error `jwt expired`
- [ ] ✅ `jwt.verify()` rechaza tokens con firma inválida
- [ ] ✅ Middleware retorna 401 sin Authorization header
- [ ] ✅ Middleware retorna 401 con token expirado
- [ ] ✅ Middleware retorna 401 con Bearer malformado
- [ ] ✅ En `NODE_ENV=production` falla sin `JWT_SECRET`

### Tests Manuales (Postman/cURL)

#### Generar token válido
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@test.com",
    "password": "password123"
  }'
```
**Validar:** Respuesta incluye `token` y campo `exp`

#### Usar token válido
```bash
curl -X GET http://localhost:3000/api/gastos \
  -H "Authorization: Bearer <TOKEN>"
```
**Validar:** Retorna 200 y datos del usuario

#### Usar token expirado
- Editar el token JWT: cambiar `"exp"` a pasado en jwt.io (NO SEGURO EN PROD)
- O esperar 12 horas
**Validar:** Retorna 401 `"Token inválido o expirado"`

#### Sin token
```bash
curl -X GET http://localhost:3000/api/gastos
```
**Validar:** Retorna 401 `"Token requerido"`

#### Token malformado
```bash
curl -X GET http://localhost:3000/api/gastos \
  -H "Authorization: Bearer invalid.token"
```
**Validar:** Retorna 401

---

## ♿ Mensajes Accesibles (Frontend)

### Tests Automatizados (Jest → `npm test`)
- [ ] ✅ Region con `role="status"` + `aria-live="polite"`
- [ ] ✅ Campos con error tienen `aria-invalid="true"`
- [ ] ✅ Campos vinculados a error messages con `aria-describedby`
- [ ] ✅ Labels tienen `htmlFor` correcto
- [ ] ✅ Mensajes de error tienen `role="alert"`
- [ ] ✅ HTML tiene `lang="es"`
- [ ] ✅ Axe scan: 0 violaciones críticas

### Tests Manuales - Navegador

#### ✅ Verificar ARIA con DevTools
1. Abrir página `/login`
2. Abrir DevTools → Inspector/Elements
3. Inspeccionar input email: ✓ tiene `aria-describedby` y `aria-invalid`
4. Inspeccionar párrafo de error: ✓ tiene `role="alert"`
5. Verificar layout.tsx: ✓ `<html lang="es">`

#### ✅ Prueba con lector de pantalla simulado
**Windows:**
- Descargar NVDA (gratis): https://www.nvaccess.org/
- Abrir login page
- Activar Num + Alt + N
- Navegar con teclado (Tab, Shift+Tab)
- ✓ Leer: "Correo" (label), campo input
- ✓ Leer: "Contraseña", campo input
- ✓ Leer: "Error: Campo requerido" (si hay error)
- ✓ Leer: "Botón Iniciar Sesión"

**macOS:**
- Usar VoiceOver integrado: Cmd + F5
- Navegar con VO + flecha derecha/izquierda
- ✓ Escuchar pronunciación de labels y roles

#### ✅ Prueba de teclado
1. Abrir `/login`
2. Presionar Tab sucesivamente
3. ✓ Orden lógico: Email → Contraseña → Botón → volverá a Email
4. ✓ Cada elemento debe tener outline visible
5. ✓ Botón se activa con Enter o Espacio

#### ✅ Validación de contraste (WCAG AA)
- Instalar extensión "WAVE": https://wave.webaim.org/extension/
- O usar "Lighthouse" en DevTools (Ctrl+Shift+I → Lighthouse)
- Ejecutar: `npm test -- --coverage`
- ✓ Contraste mínimo 4.5:1 para texto

---

## 📊 Reporte de Ejecución

```markdown
### Fecha: _______________
### Testeador: _______________

| Requisito | Estado | Evidencia | Notas |
|-----------|--------|-----------|-------|
| JWT - 12h expiración | ☐ Pass / ☐ Fail | Token desc: exp=... | |
| JWT - Rechaza expirado | ☐ Pass / ☐ Fail | Response: 401 | |
| Auth Middleware | ☐ Pass / ☐ Fail | Postman test: ✓ | |
| ARIA Labels | ☐ Pass / ☐ Fail | DevTools: htmlFor=... | |
| ARIA Live Region | ☐ Pass / ☐ Fail | Inspector: role=status | |
| SR - NVDA Test | ☐ Pass / ☐ Fail | ✓ Lee correctamente | |
| Keyboard Nav | ☐ Pass / ☐ Fail | Tab order correcto | |
| Contraste WCAG AA | ☐ Pass / ☐ Fail | Lighthouse score | |

### Problemas encontrados:
- ...

### Acción requerida:
- ...
```

---

## 🚀 Comandos Rápidos

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Tests Backend
cd backend  
npm test -- --watch

# Terminal 3 - Frontend
cd frontend
npm run dev

# Validación rápida
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}'
```

---

## 📋 Referencias

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [ARIA Authoring Guide](https://www.w3.org/WAI/ARIA/apg/)
- [NVDA Lector Pantalla](https://www.nvaccess.org/)
