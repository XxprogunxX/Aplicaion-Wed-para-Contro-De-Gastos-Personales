# CI/CD y validación pre-producción

Este proyecto usa GitHub Actions para validar calidad técnica antes de desplegar.

## Pipelines activos

- Backend: `.github/workflows/backend-ci.yml`
	- Lint (`npm run lint`)
	- Tests (`npm test`)
	- Build Docker (si quality checks pasan)

- Frontend: `.github/workflows/frontend-ci.yml`
	- Lint (`npm run lint`)
	- Tests (`npm test -- --ci --passWithNoTests`)
	- Type check (`npm run type-check`)
	- Build producción (`npm run build`)
	- Bundle budget (`npm run bundle:check`)
	- Lighthouse CI (`@lhci/cli autorun`)
	- Build Docker (si quality checks pasan)

## Métricas mínimas exigidas

- Lighthouse Performance: `>= 0.75`
- Lighthouse Accessibility: `>= 0.90`
- Lighthouse Best Practices: `>= 0.85`
- Bundle total JS (`.next/static/chunks`): `<= 1400000` bytes
- Chunk JS más grande: `<= 400000` bytes

> Los budgets están en `frontend/bundle-budget.json` y se ajustan según la evolución del producto.

## Criterio de salida a producción

No se permite merge/release a rama de producción si falla cualquiera de estos checks:

- lint
- tests
- build
- bundle budget
- Lighthouse accessibility/performance

## Si hay fallo en CI

1. Registrar incidente en `docs/postmortem-template.md`.
2. Clasificar causa principal:
	 - performance
	 - accesibilidad
	 - mala implementación
3. Definir acción correctiva y fecha objetivo.
4. Re-ejecutar pipeline y adjuntar evidencia del verde.
