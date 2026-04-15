# 🔄 GitHub Configuration & CI/CD

Configuración centralizada de GitHub para el proyecto, incluyendo CI/CD pipelines, automatización y governance.

## 📂 Files & Directories

### Workflows (`.github/workflows/`)

| File | Purpose | Trigger |
|------|---------|---------|
| [`backend-ci.yml`](workflows/backend-ci.yml) | CI pipeline for backend Node.js | Push/PR to backend/**  |
| [`frontend-ci.yml`](workflows/frontend-ci.yml) | CI pipeline for frontend Next.js | Push/PR to frontend/** |
| [`main-ci.yml`](workflows/main-ci.yml) | Orchestrator for both pipelines | All pushes/PRs |
| [`deploy.yml`](workflows/deploy.yml) | Manual deployment workflow | workflow_dispatch |
| [`pr-validation.yml`](workflows/pr-validation.yml) | PR quality validation | PR opened/edited |

### Configuration Files

| File | Purpose |
|------|---------|
| [`dependabot.yml`](dependabot.yml) | Auto-update dependencies (npm, docker, actions) |
| [`CODEOWNERS`](CODEOWNERS) | Code ownership & auto-reviewer assignment |
| [`pull_request_template.md`](pull_request_template.md) | PR template for consistent PRs |

### Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| [`CICD.md`](CICD.md) | Complete CI/CD documentation | Engineers, DevOps |
| [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) | How to work with CI/CD | Frontend/Backend devs |

---

## 🚀 CI/CD Pipeline Overview

### Architecture

```
┌─────────────────────────────────────────┐
│       GitHub Push / Pull Request        │
└──────────────┬──────────────────────────┘
               │
               ▼
     ┌─────────────────────┐
     │   main-ci.yml       │ (Orchestrator)
     └──────┬──────────────┘
            │
            ├──────────────────────┬──────────────────────┐
            ▼                      ▼                      ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  backend-ci.yml  │  │ frontend-ci.yml  │  │pr-validation.yml │
    ├──────────────────┤  ├──────────────────┤  └──────────────────┘
    │ • Lint           │  │ • Quality checks │
    │ • Tests          │  │ • Build & analyze│
    │ • Security       │  │ • Accessibility  │
    │ • Docker build   │  │ • Security       │
    │                  │  │ • Docker build   │
    └────────┬─────────┘  └────────┬─────────┘
             │                     │
             └──────────┬──────────┘
                        ▼
           ┌────────────────────────┐
           │  Status Check & Report │
           └────────────────────────┘
```

### Key Workflows

#### 1. Backend CI (`backend-ci.yml`)
- **Node.js 20.x** testing & building
- ESLint + Jest tests
- Security audit
- Docker image build & push
- **Failure blocks merge** to master/develop

#### 2. Frontend CI (`frontend-ci.yml`)
- TypeScript + ESLint validation
- Jest tests with coverage
- Next.js production build
- Bundle size validation (< 1.6MB total)
- Lighthouse CI (performance >= 75%, accessibility >= 90%)
- **Failure blocks merge** to master/develop

#### 3. PR Validation (`pr-validation.yml`)
- Title format check (conventional commits)
- Description validation
- Labels enforcement
- Auto-comment with checklist

#### 4. Deployment (`deploy.yml`)
- Manual staging/production deploys
- Tests before deploy
- Docker image push to registry
- Deployment logs in GitHub summary

---

## 🔧 Quick Commands

### Run CI locally

```bash
# Backend
cd backend && npm ci && npm run lint && npm test

# Frontend
cd frontend && npm ci && npm run lint && npm test -- --ci && npm run type-check && npm run build
```

### Manually trigger workflows

1. Go to **Actions** tab in GitHub
2. Select workflow (backend-ci, frontend-ci, deploy, etc.)
3. Click **Run workflow**
4. Select branch & inputs if needed

### View workflow logs

1. Go to **Actions** tab
2. Click on workflow run
3. Click on failed job
4. Expand failed step to see logs

---

## 📊 Quality Gates

### Backend

| Check | Requirement | Blocks Merge |
|-------|-------------|--------------|
| Lint | ESLint pass | ✅ Yes |
| Tests | All pass | ✅ Yes |
| Build | Success | ✅ Yes |
| Audit | No critical | ⚠️ No (warning) |

### Frontend

| Check | Requirement | Blocks Merge |
|-------|-------------|--------------|
| Lint | ESLint pass | ✅ Yes |
| Types | TS no-emit | ✅ Yes |
| Tests | All pass | ✅ Yes |
| Build | Success | ✅ Yes |
| Bundle | <= 1.6MB | ✅ Yes |
| Lighthouse | >= 75% perf, 90% a11y | ✅ Yes |
| Audit | No moderate | ⚠️ No (warning) |

---

## 🔐 Automation

### Dependabot

Auto-creates PRs for dependency updates:
- **npm packages** (backend, frontend): weekly on Monday
- **Docker images**: weekly on Tuesday
- **GitHub Actions**: weekly on Wednesday

Each PR:
- Runs full CI/CD
- Auto-labeled with `dependencies`
- Assigned to `oscar`
- Rebase strategy: automatic

### Auto-reviewers (CODEOWNERS)

When files change, requester auto-assigned:
- Example: Change in `backend/**` → `@oscar` auto-requested
- Can be disabled in branch protection settings

---

## 📝 Contributing

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auth): add password reset
fix(dashboard): fix chart colors
docs: update README
chore(deps): update react
```

### Pull Requests

1. Use template: [pull_request_template.md](pull_request_template.md)
2. Title: `type(scope): description`
3. Link issue: `closes #123`
4. Request reviewers
5. Add labels

### Pre-push Tips

Always run locally:
```bash
npm run lint && npm test
```

Use `[skip ci]` for doc-only changes:
```bash
git commit -m "docs: update README [skip ci]"
```

---

## 🐛 Troubleshooting

### "Cannot find module X"

**Solution:** Check if module is in `package.json` dependencies

```bash
cd backend  # or frontend
npm list <module-name>
npm install <module-name>  # if missing
```

### "Bundle size exceeds limit"

**Solutions:**
```typescript
// 1. Dynamic imports
const Component = dynamic(() => import('./Heavy'));

// 2. Code splitting
const [Component, setComponent] = useState(null);

// 3. Remove unused deps
npm uninstall unused-package
```

### "Lighthouse CI failed"

**Check:**
1. `npm run build` locally
2. Review `.lighthouse*` artifacts in failed run
3. Common issues:
   - Missing `alt` text on images
   - Unoptimized images
   - Large JavaScript payload

### "Dependabot PRs failing"

**Fix:**
1. Review the changes
2. Run locally: `npm ci && npm test`
3. If tests fail → you may need to update code
4. If CI green → approve and merge

---

## 📚 Full Documentation

- **[CI/CD Documentation](CICD.md)** - Detailed pipeline docs
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Working with CI/CD
- **[Backend README](../backend/README.md)** - Backend setup
- **[Frontend README](../frontend/README.md)** - Frontend setup

---

## 🎯 Next Steps

- [ ] Enable branch protection (require status checks)
- [ ] Configure secrets (API keys, tokens)
- [ ] Set up CodeCov for coverage tracking
- [ ] Add deployment notifications (Slack)
- [ ] Review & adjust Lighthouse thresholds if needed

---

## 📞 Support

For questions or issues with CI/CD:
1. Check [CI/CD Documentation](CICD.md)
2. Check workflow logs in GitHub Actions
3. Review [Developer Guide](DEVELOPER_GUIDE.md)
4. Open an issue with `[ci]` label
