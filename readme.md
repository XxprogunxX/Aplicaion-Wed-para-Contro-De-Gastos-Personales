# Aplicación Web para Control de Gastos Personales

Repositorio del proyecto para la gestión y control de gastos personales.

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
- Base de datos: MongoDB
- Autenticación: JWT

### Herramientas
- Gestor de paquetes: npm
- Containerización: Docker
- Control de versiones: Git

## Equipo
- Tech Lead: [Nombre]
- Frontend: [Nombre]
- Backend: [Nombre]
- QA / Testing: [Nombre]
- DevOps / CI-CD: [Nombre]

- MongoDB (local o MongoDB Atlas)

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
