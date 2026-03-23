# Aplicación Web para Control de Gastos Personales

[![Node.js CI](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions/workflows/node.yml/badge.svg)](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions)
[![CI/CD Pipeline Backend](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions)
[![CI/CD Pipeline Frontend](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions)

Repositorio del proyecto para la **gestión y control de gastos personales**. Una aplicación fullstack moderna con backend API y frontend responsivo.

El backend expone una API REST; el frontend es Next.js 14 con build de producción verificado. Hay **Dockerfiles de producción** (`Dockerfile`) y **de desarrollo** (`Dockerfile.dev`) más `docker-compose.yml` para levantar ambos servicios.

## Estructura del repositorio

```
├── frontend/            # Aplicación frontend (Next.js)
│   ├── src/
│   │   ├── app/        # App Router de Next.js
│   │   ├── components/ # Componentes reutilizables
│   │   ├── lib/        # Utilidades y API client
│   │   └── types/      # Tipos de TypeScript
│   ├── Dockerfile      # Configuración Docker
│   ├── package.json    # Dependencias del frontend
│   └── README.md       # Documentación del frontend
├── backend/             # Servidor backend
│   ├── src/
│   │   ├── models/     # Modelos de datos
│   │   ├── routes/     # Rutas de la API
│   │   ├── middleware/ # Middlewares
│   │   ├── utils/      # Utilidades
│   │   └── index.js    # Punto de entrada
│   ├── Dockerfile      # Configuración Docker
│   ├── package.json    # Dependencias del backend
│   └── README.md       # Documentación del backend
├── docs/               # Documentación del proyecto
│   └── individual/     # Documentación individual de cada miembro
├── .gitignore         # Archivos ignorados por git
├── test-ci.md         # Pruebas de CI/CD
└── README.md          # Este archivo
```

## Tecnologías principales

### Frontend
- Framework: Next.js 14 (App Router)
- Lenguaje: TypeScript
- Estilos: Tailwind CSS
- Gestión de estado: React Context

### Backend
- Runtime: Node.js
- Framework: Express.js
- Lenguaje: JavaScript (ES6+)
- Base de datos:
- Autenticación: JWT

### Herramientas
- Gestor de paquetes: npm
- Containerización: Docker
- Control de versiones: Git
- CI/CD: GitHub Actions

## CI/CD (GitHub Actions)

Workflows en `.github/workflows/`:

| Workflow | Cuándo | Qué hace |
|----------|--------|----------|
| **backend-ci.yml** | Push/PR a `main`, `master`, `develop` (y ramas `features/*`) si cambia `backend/**` | Node **20**, `npm ci`, `lint`, `test`, build Docker con `backend/Dockerfile` |
| **frontend-ci.yml** | Igual si cambia `frontend/**` | Node **20**, `lint`, `test`, `type-check`, `build`, `bundle:check`, Lighthouse (no bloquea el job si falla), build Docker con `frontend/Dockerfile` y `NEXT_PUBLIC_API_URL` |
| **node.yml** | Solo manual (`workflow_dispatch`) | Placeholder legado |

También puedes lanzar **backend-ci** y **frontend-ci** a mano desde la pestaña **Actions** → *Run workflow*.

El estado aparece en **Actions** del repositorio y en los badges del encabezado de este README (ajusta la URL del repo en el badge si haces fork).



### Instalación del Frontend

```bash
# Navegar a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar en modo desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3001`

### Instalación del Backend

```bash
# Navegar a la carpeta del backend
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar el servidor en modo desarrollo
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### Variables de entorno

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Control de Gastos Personales
```

**Backend** (`.env`):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/gastos-personales
JWT_SECRET=tu_clave_secreta_aqui
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

## Docker

### Producción (imagen mínima)

- **Backend:** `backend/Dockerfile` — `npm ci --omit=dev`, `node src/index.js`, puerto **3000**.
- **Frontend:** `frontend/Dockerfile` — `next build`, usuario no root, puerto **3001**.

```bash
# Backend
cd backend && docker build -t gastos-backend . && docker run -p 3000:3000 --env-file .env gastos-backend

# Frontend (define la URL pública del API en build)
cd frontend && docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:3000 -t gastos-frontend . \
  && docker run -p 3001:3001 -e NEXT_PUBLIC_API_URL=http://localhost:3000 gastos-frontend
```

### Desarrollo con docker-compose (hot reload)

Usa `Dockerfile.dev` en cada servicio (incluye devDependencies y `npm run dev`):

```bash
# Desde la raíz del repo
docker compose up --build
```

- API: `http://localhost:3002` (mapeo al contenedor 3000).
- Frontend: `http://localhost:3001`.
- Crea `backend/.env` (puedes partir de `backend/.env.example`) y ajusta `CORS_ORIGIN` si cambias el origen del front.

## Contribuir
1. Crear una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer commits descriptivos: `git commit -m "Agregar funcionalidad X"`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crear un Pull Request

## Documentación Individual
Cada miembro del equipo debe crear su propia investigación en la carpeta `docs/individual/`. 
Puedes usar la plantilla disponible en [docs/individual/plantilla_investigacion.md](docs/individual/plantilla_investigacion.md).

## Licencia
Este proyecto es parte de un proyecto académico.

## Despliegue en Vercel (monorepo)

Para evitar `404: NOT_FOUND` en Vercel, este repositorio incluye `vercel.json` en la raíz apuntando al proyecto de `frontend`.

Configura en Vercel:

1. Importa el repositorio completo.
2. Variables de entorno del frontend:
   - `NEXT_PUBLIC_API_URL=https://<tu-backend-publico>`
   - `NEXT_PUBLIC_APP_NAME=Control de Gastos Personales`
3. Despliega nuevamente.

Si ya tenías el proyecto creado en Vercel, ejecuta **Redeploy** para que tome la nueva configuración.
