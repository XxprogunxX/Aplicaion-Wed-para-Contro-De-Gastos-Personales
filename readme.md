# Aplicación Web para Control de Gastos Personales

[![Node.js CI](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions/workflows/node.yml/badge.svg)](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions)
[![CI/CD Pipeline Backend](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions)
[![CI/CD Pipeline Frontend](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/XxprogunxX/Aplicaion-Wed-para-Contro-De-Gastos-Personales/actions)

Repositorio del proyecto para la **gestión y control de gastos personales**. Una aplicación fullstack moderna con backend API y frontend responsivo.

El backend está implementado y expone una API REST funcional; el frontend cuenta con Dockerfile y package.json configurados, aunque la app aún está en construcción (el script de build es provisional).

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

## CI/CD Pipeline

Este proyecto incluye pipelines automáticos de **Integración Continua** configurados con GitHub Actions:

### Workflows disponibles

1. **node.yml** - Pipeline general
   - Se ejecuta en: Push y Pull Request a `master`
   - Acciones: Instala dependencias y ejecuta tests

2. **backend-ci.yml** - Pipeline del backend
   - Se ejecuta en: Push y Pull Request a `master` y `develop` cuando hay cambios en `/backend`
   - Matriz de pruebas: Node 18.x y 20.x
   - Acciones:
     - Instala dependencias (`npm ci`)
     - Ejecuta linter (`npm run lint`)
     - Ejecuta tests (`npm test`)
     - Construye imagen Docker

3. **frontend-ci.yml** - Pipeline del frontend
   - Se ejecuta en: Push y Pull Request a `master` y `develop` cuando hay cambios en `/frontend`
   - Matriz de pruebas: Node 18.x y 20.x
   - Acciones:
     - Instala dependencias (`npm ci`)
     - Ejecuta linter (`npm run lint`)
     - Verifica tipos TypeScript (`npm run type-check`)
     - Construye el proyecto (`npm run build`)
     - Construye imagen Docker

### Estado de los Workflows

Los workflows se configuran automáticamente en GitHub cuando haces push a las ramas configuradas. Puedes ver el estado de los pipelines en la pestaña **Actions** de tu repositorio.



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

## Ejecutar con Docker

### Construir y ejecutar el backend
```bash
cd backend
docker build -t gastos-backend .
docker run -p 3000:3000 --env-file .env gastos-backend
```

### Construir y ejecutar el frontend
```bash
cd frontend
docker build -t gastos-frontend .
docker run -p 3001:3001 gastos-frontales
JWT_SECRET=tu_clave_secreta_aqui
NODE_ENV=development
```

## Ejecutar con Docker

```bash
# Construir la imagen
cd backend
docker build -t gastos-backend .

# Ejecutar el contenedor
docker run -p 3000:3000 --env-file .env gastos-backend
```

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
