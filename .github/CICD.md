# 🚀 CI/CD Pipeline Documentation

Documentación completa de los pipelines de integración continua y despliegue continuo del proyecto.

## Tabla de Contenidos

- [Overview](#overview)
- [Pipelines](#pipelines)
- [Triggers](#triggers)
- [Quality Gates](#quality-gates)
- [Secrets & Environment Variables](#secrets--environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Overview

El proyecto utiliza **GitHub Actions** para automatizar:
- ✅ Linting y validación de código
- ✅ Ejecución de tests
- ✅ Verificaciones de seguridad
- ✅ Análisis de performance (Lighthouse)
- ✅ Validación de accesibilidad
- ✅ Build de imágenes Docker
- ✅ Despliegues manuales

### Architecture

```
main-ci.yml (Orquestador)
├── backend-ci.yml
│   ├── lint-and-test
│   ├── security
│   └── build (Docker)
└── frontend-ci.yml
    ├── quality
    ├── build-and-analyze (Lighthouse + Bundle)
    ├── accessibility
    ├── security
    └── build (Docker)
```

---

## Pipelines

### 1. Backend CI Pipeline (`backend-ci.yml`)

**Propósito:** Validar calidad y builds del backend Node.js/Express

#### Jobs:

##### `lint-and-test`
- **Ejecuta:**
  - ESLint validation
  - Jest unit tests con coverage
  - Detecta memory leaks & handle abiertos
- **Artifacts:** Coverage reports (Codecov)
- **Falla si:** Lint errors o tests fallan

##### `security`
- **Ejecuta:**
  - `npm audit` - Detecta vulnerabilidades en dependencias
  - Nivel de auditoría: `moderate` (warning/error)
- **Nota:** Continúa aunque falle (informativo)

##### `build`
- **Ejecuta:**
  - Build de Docker image
  - Push a GitHub Container Registry (si no es PR)
- **Requiere:** Jobs anteriores pasen
- **Tags:**
  - `gastos-backend:latest` (rama actual)
  - `gastos-backend:${SHA}` (específico del commit)

#### Variables disponibles:
```yaml
NODE_VERSION: 20.x
REGISTRY: ghcr.io
IMAGE_NAME: <owner>/<repo>-backend
```

---

### 2. Frontend CI Pipeline (`frontend-ci.yml`)

**Propósito:** Validar calidad, performance y accesibilidad del frontend Next.js

#### Jobs:

##### `quality`
- **Ejecuta:**
  - ESLint validation
  - Jest tests con coverage (--passWithNoTests)
  - TypeScript type checking
- **Artifacts:** Coverage reports (Codecov)
- **Falla si:** Lint errors, type errors o tests fallan

##### `build-and-analyze`
- **Ejecuta:**
  - Next.js production build
  - Bundle size validation (via `npm run bundle:check`)
  - Lighthouse CI (performance, accessibility, best-practices)
- **Métricas exigidas:**
  ```
  Performance:      >= 0.75 (75%)
  Accessibility:    >= 0.90 (90%)
  Best Practices:   >= 0.85 (85%)
  SEO:              >= 0.70 (70%) [warning]
  ```
- **Bundle limits:**
  ```
  Total JS:         <= 1,600,000 bytes
  Largest chunk:    <= 420,000 bytes
  ```
- **Falla si:** Límites excedidos

##### `accessibility`
- **Ejecuta:**
  - jest-axe suite de tests
  - Busca tests con patrón `accessibility` en nombre
- **Nota:** Continúa aunque falle (extra validation)

##### `security`
- **Ejecuta:**
  - `npm audit` - Vulnerabilidades
  - OWASP Dependency Check
- **Nota:** Continúa aunque falle (informativo)

##### `build-docker`
- **Ejecuta:**
  - Build de Docker image
  - Push a GitHub Container Registry
- **Requiere:** `quality` y `build-and-analyze` pasen
- **Tags:** Similar al backend

---

### 3. Main CI Workflow (`main-ci.yml`)

**Propósito:** Orquestar ambos pipelines y reportar status

#### Features:
- Ejecuta backend y frontend en paralelo
- Aguarda resultados de ambos
- Comenta en PR con status
- Falla si alguno de los pipelines falla

---

### 4. Deploy Workflow (`deploy.yml`)

**Propósito:** Despliegues manuales a staging/production

#### Trigger: `workflow_dispatch` (manual)

#### Inputs:
```yaml
environment:  staging | production (default: staging)
backend:      true | false (default: true)
frontend:     true | false (default: true)
```

#### Validations:
- ✅ Production solo desde rama `master`
- ✅ Ejecuta tests antes de desplegar
- ✅ Builds Docker images con tags del ambiente

#### Ejemplo de uso:

1. Ir a **Actions** → **Deploy** → **Run workflow**
2. Seleccionar environment: `production`
3. Seleccionar componentes: backend ✓, frontend ✓
4. Click **Run workflow**

---

## Triggers

### Branches monitoreadas
- `master` - rama principal
- `develop` - rama de desarrollo
- `features/**` - ramas de features

### Path filters (cuando aplican)

**Backend CI:** Solo si hay cambios en `backend/**` o `.github/workflows/backend-ci.yml`

**Frontend CI:** Solo si hay cambios en `frontend/**` o `.github/workflows/frontend-ci.yml`

### Eventos

- **Push:** A cualquiera de las ramas monitoreadas
- **Pull Request:** Hacia `master` o `develop`
- **Manual (Deploy):** Workflow dispatch con inputs

---

## Quality Gates

### Backend

| Métrica | Requisito | Falla si |
|---------|-----------|----------|
| Linting | ESLint pass | Algún error |
| Tests | 100% pass | Test falla |
| Vulnerabilidades | audit moderate | ⚠️ aviso (no bloquea) |
| Docker build | Éxito | Cualquier error |

### Frontend

| Métrica | Requisito | Falla si |
|---------|-----------|----------|
| Linting | ESLint pass | Algún error |
| Tests | 100% pass | Test falla |
| Types | TS no-emit | TypeError |
| Performance | >= 75% | Score < umbral |
| Accessibility | >= 90% | Score < umbral |
| Bundle | <= 1.6MB total | Límite excedido |
| Vulnerabilidades | audit moderate | ⚠️ aviso (no bloquea) |

---

## Secrets & Environment Variables

### Required Secrets

Configurados en **Settings** → **Secrets and variables** → **Actions**:

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `GITHUB_TOKEN` | Automático en cada run | N/A |
| `LHCI_GITHUB_APP_TOKEN` | Para reportes Lighthouse | (opcional) |

### Environment Variables

Definidos en cada workflow:

```yaml
NODE_VERSION: '20.x'
REGISTRY: ghcr.io
IMAGE_NAME: ${{ github.repository }}-{backend|frontend}
```

---

## Caching Strategy

### Node Modules Cache

```yaml
key: ${{ runner.os }}-{backend|frontend}-node-${{ hashFiles('**/package-lock.json') }}
restore-keys: |
  ${{ runner.os }}-{backend|frontend}-node-
```

**Ventajas:**
- ✅ Faster installs (skip npm ci si cache hit)
- ✅ Automatic invalidation si package-lock.json cambia
- ✅ Cache compartido entre runs

### Docker Layer Cache

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

---

## Artifacts & Reports

### Coverage Reports (Codecov)

- **Backend:** `backend/coverage/lcov.info`
- **Frontend:** `frontend/coverage/lcov.info`
- **Automatizado:** `codecov/codecov-action@v3`
- **Dashboard:** https://codecov.io

### Lighthouse Reports

- **Location:** `.lighthouseci/` directory
- **Reports:** JSON/HTML en GitHub Actions results
- **Upload:** Temporary public storage

### Build Artifacts

- **Frontend build:** `.next/` directory
- **Retention:** 5 days
- **Used for:** Debugging failed builds

---

## Monitoring & Notifications

### GitHub Checks

Cada job aparece como "Check" en:
- Pull Request details
- Commit status
- Actions tab

### PR Comments

El workflow `main-ci.yml` comenta status en PRs:
```
## CI/CD Status

- Backend: ✅
- Frontend: ✅
```

### Email Notifications

GitHub notifica automáticamente:
- ✅ Workflow failures
- ✅ 60 min after last failure
- ✅ Configurar en Settings → Notifications

---

## Common Issues & Solutions

### ❌ "Cannot find module 'next-i18next'"

**Causa:** Mock de módulo inexistente

**Solución:**
```typescript
// ❌ MAL
jest.mock('next-i18next', () => ({...}));

// ✅ BIEN - Solo mockear módulos instalados
jest.mock('next/navigation', () => ({...}));
```

### ❌ Lighthouse timeout

**Causa:** Server no inicia en tiempo

**Solución:**
```yaml
startServerCommand: "npm run start"
startServerReadyPattern: "- ready"  # Pattern correcto
```

### ❌ Docker build fails in CI

**Causa:** Cache invalidation o dependencias faltantes

**Soluciones:**
1. Verificar Dockerfile RUN commands
2. Limpiar layer cache: `docker builder prune`
3. Usar `npm ci` en lugar de `npm install`

### ❌ Coverage reports not uploading

**Causa:** Path incorrecta o archivo no generado

**Solución:**
```bash
# Verificar que jest genera coverage
npm test -- --coverage

# Verificar archivo existe
ls backend/coverage/lcov.info  # o frontend
```

### ❌ Bundle size exceeds limit

**Causa:** Dependencias grandes o código no tree-shakeable

**Soluciones:**
```bash
# Analizar bundle
npm run bundle:check

# Identificar culprables
npx webpack-bundle-analyzer

# Opciones:
1. Lazy load componentes
2. Usar code splitting
3. Remover dependencias innecesarias
```

---

## Performance Tips

### Local Running (simular CI)

```bash
# Backend
cd backend
npm ci
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

### Faster Iterations

1. **Use branch filters** para evitar runs innecesarios
2. **Cache aggressively** - `.github/workflows/` también triggeran
3. **Skip CI en commits** si necesario:
   ```bash
   git commit -m "Fix typo [skip ci]"
   ```

---

## Deployment Flow

```
Feature branch → PR → CI Checks ✅ → Merge to develop
                                        ↓
Develop branch → CI Checks ✅ → Manual Deploy to staging
                                        ↓
Test in staging → Merge to master → CI Checks ✅
                                        ↓
Master branch → Manual Deploy to production
```

---

## Maintenance

### Weekly Tasks
- [ ] Revisar vulnerabilidades npm audit
- [ ] Actualizar actions a latest versions
- [ ] Revisar Lighthouse scores trend

### Monthly Tasks
- [ ] Actualizar Node.js version (si disponible)
- [ ] Revisar y ajustar thresholds (budgets, scores)
- [ ] Cleanup artifacts antiguos

### Before Major Release
- [ ] Ejecutar todos los checks localmente
- [ ] Revisar postmortem de incidentes
- [ ] Update documentation

---

## References

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [project test-ci.md](../test-ci.md)
- [Backend README](../backend/README.md)
- [Frontend README](../frontend/README.md)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
