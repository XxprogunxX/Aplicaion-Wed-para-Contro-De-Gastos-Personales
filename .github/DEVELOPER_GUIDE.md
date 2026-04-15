# 🔧 Developer Guide - CI/CD Workflow

Guía práctica para trabajar efectivamente con el pipeline CI/CD del proyecto.

## ⚡ Quick Start

### 1. Before You Push

```bash
# Backend checks
cd backend
npm run lint
npm test

# Frontend checks
cd frontend
npm run lint
npm test -- --ci --passWithNoTests
npm run type-check
npm run build
```

### 2. Commit Message Convention

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - Nuevo feature
- `fix` - Bug fix
- `docs` - Cambios en documentación
- `style` - Cambios de formato (no afectan lógica)
- `refactor` - Refactorización sin cambios funcionales
- `perf` - Mejoras de performance
- `test` - Agregar/actualizar tests
- `chore` - Cambios build/deps
- `ci` - Cambios CI/CD

**Ejemplos:**
```bash
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(dashboard): fix chart rendering issue"
git commit -m "docs: update installation instructions"
git commit -m "chore(deps): update react to 18.3"
```

### 3. Create Pull Request

**Antes de abrir PR:**
- [ ] Asegúrate que pasan todos los checks locales
- [ ] Rebasa tu rama con `develop`
- [ ] Actualiza o crea tests
- [ ] Actualiza documentación si es necesario

**Al abrir PR:**
1. Usa titulo con convention: `feat(scope): description`
2. Escribe descripción clara
3. Link la issue relacionada: `closes #123`
4. Asigna labels (type, component, priority)
5. Solicita reviewers

### 4. PR Description Template

```markdown
## 📝 Description
Brief description of what this PR does.

## 🎯 Related Issue
Closes #123

## 🔄 Changes Made
- Change 1
- Change 2
- Change 3

## 🧪 Testing
How to test these changes:
1. Step 1
2. Step 2

## 📸 Screenshots (if applicable)
Before/after screenshots

## ✅ Checklist
- [x] Tested locally
- [x] Updated tests
- [x] Updated docs
- [x] No breaking changes
```

---

## 🔍 Understanding CI/CD Failures

### Workflow Status Badge

En el PR, verás status de los checks:

```
✅ All checks have passed
❌ Some checks failed
⏳ Still running
```

Click en **Details** para ver logs detallados.

### Common Failures & Fixes

#### 1. Lint Errors

**Error:**
```
FAIL  src/app/auth/login.tsx
✕ ESLint validation failed
  Line 42: Unexpected console statement (no-console)
```

**Fix:**
```javascript
// ❌ WRONG
console.log('debugging');

// ✅ CORRECT (si necesitas log)
if (process.env.NODE_ENV === 'development') {
  console.log('debugging');
}

// ✅ BETTER (usar logger)
logger.debug('message');
```

#### 2. Test Failures

**Error:**
```
FAIL src/components/Button.test.tsx
● Button renders correctly
  expect(received).toBe(true)
  Received: false
```

**Fix:**
1. Ejecuta locally: `npm test -- Button.test.tsx`
2. Lee el error completo
3. Actualiza el test o el código

#### 3. Type Errors

**Error:**
```
error TS2322: Type 'string' is not assignable to type 'number'.
12:   count: "5"
```

**Fix:**
```typescript
// ❌ WRONG
const count: number = "5";

// ✅ CORRECT
const count: number = 5;
```

#### 4. Bundle Size Exceeded

**Error:**
```
FAIL  Bundle size check
  Total JS: 1,750,000 bytes > 1,600,000 limit
  Largest chunk: 480,000 bytes > 420,000 limit
```

**Fixes:**
```typescript
// 1. Lazy load components
const HeavyComponent = dynamic(() => import('./Heavy'));

// 2. Code splitting
const routes = [
  { path: '/admin', component: () => import('./admin/Dashboard') }
];

// 3. Remove unused deps
npm list unused-package
npm uninstall unused-package
```

#### 5. Lighthouse Score Too Low

**Error:**
```
FAIL  Lighthouse CI
  Performance: 0.65 < 0.75 minimum
```

**Fixes:**

Performance (Core Web Vitals):
- Use `next/image` for images
- Minimize JavaScript
- Optimize fonts loading
- Lazy load below-the-fold content

Accessibility (WCAG):
- Add alt text: `<img alt="description" />`
- Use semantic HTML: `<button>`, not `<div onClick>`
- Ensure color contrast ratio >= 4.5:1

```typescript
// ❌ BAD
<img src="photo.jpg" />
<div role="button" onClick={handleClick}>Click me</div>

// ✅ GOOD
<Image src="photo.jpg" alt="User photo" />
<button onClick={handleClick}>Click me</button>
```

---

## 🚀 Deploying Changes

### To Staging

```bash
# 1. Merge PR to develop
git checkout develop
git pull origin develop

# 2. Go to Actions → Deploy
# 3. Click "Run workflow"
# 4. Select:
#    - environment: staging
#    - backend: ✓
#    - frontend: ✓
# 5. Click "Run workflow"
```

### To Production

```bash
# 1. Merge changes to master (via PR)
# 2. Create GitHub Release (optional but recommended)
# 3. Go to Actions → Deploy
# 4. Click "Run workflow"
# 5. Select:
#    - environment: production
#    - backend: ✓
#    - frontend: ✓
```

---

## 🛠️ Local Development Tips

### Skip CI for trivial changes

```bash
git commit -m "Fix typo [skip ci]"
git push

# CI/CD no correrá - útil para cambios de documentación
```

### Manually re-run CI

Si quieres re-ejecutar los checks sin cambios:

1. Go to **Actions** tab
2. Select the workflow (backend-ci, frontend-ci)
3. Click **Run workflow**

### Simulate CI locally

```bash
# Backend
cd backend
npm ci  # Use ci instead of install
npm run lint
npm test

# Frontend
cd frontend
npm ci
npm run lint
npm test -- --ci --passWithNoTests
npm run type-check
npm run build
npm run bundle:check
```

### Debug Docker builds

```bash
# Build locally
docker build -f backend/Dockerfile -t gastos-backend:test ./backend

# Or with verbose output
DOCKER_BUILDKIT=1 docker build --progress=plain -f backend/Dockerfile -t gastos-backend:test ./backend
```

---

## 📊 Monitoring CI/CD Health

### Check Pipeline Status

- **GitHub Actions tab:** Full history and logs
- **Branch protection:** Requiere que CI pase antes de merge
- **Notifications:** GitHub envía emails si hay failures

### Performance Metrics

Monitorear en cada release:
- Build time (target: < 5 min)
- Test coverage (target: > 80%)
- Bundle size trend (target: <= 1.6MB)
- Lighthouse scores (target: >= 85/100)

---

## 🔐 Security Best Practices

### Secrets Management

Nunca comitear:
- API keys
- Passwords
- Private tokens
- AWS credentials

**Use GitHub Secrets:**
```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```

### Dependency Security

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Fix major versions (breaking)
npm audit fix --force
```

### Code Review Changes

- [ ] Revisar cambios de lógica
- [ ] Verificar no hay secrets expuestos
- [ ] Validar tests están presentes
- [ ] Revisar accesibilidad (frontend)
- [ ] Revisar performance (frontend)

---

## 📚 References

- [CI/CD Pipeline Documentation](./CICD.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Write Good Commits](https://chris.beams.io/posts/git-commit/)
- [PR Template](./pull_request_template.md)
