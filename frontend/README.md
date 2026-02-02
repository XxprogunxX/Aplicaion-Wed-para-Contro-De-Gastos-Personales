# Frontend - Control de Gastos Personales

## Tecnologías
- Framework: Next.js 14 (App Router)
- Lenguaje: TypeScript
- Estilos: CSS Modules / Tailwind CSS
- Gestión de estado: React Context / Zustand
- Gestor de paquetes: npm

## Requisitos
- Node.js v18 o superior
- npm

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
```

## Variables de entorno
Crear un archivo `.env.local` en la raíz del frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Control de Gastos
```

## Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`

## Scripts disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Ejecuta la aplicación en modo producción
- `npm run lint` - Ejecuta el linter
- `npm run type-check` - Verifica los tipos de TypeScript

## Estructura del frontend

```
frontend/
├── src/
│   ├── app/                # App Router de Next.js
│   │   ├── layout.tsx      # Layout principal
│   │   ├── page.tsx        # Página de inicio
│   │   ├── gastos/         # Páginas de gastos
│   │   ├── reportes/       # Páginas de reportes
│   │   └── auth/           # Páginas de autenticación
│   ├── components/         # Componentes reutilizables
│   │   ├── ui/            # Componentes de UI
│   │   ├── forms/         # Componentes de formularios
│   │   └── layout/        # Componentes de layout
│   ├── lib/               # Utilidades y funciones
│   │   ├── api.ts         # Cliente API
│   │   └── utils.ts       # Utilidades generales
│   ├── types/             # Tipos de TypeScript
│   └── styles/            # Estilos globales
├── public/                # Archivos estáticos
├── next.config.js         # Configuración de Next.js
├── tsconfig.json          # Configuración de TypeScript
└── package.json
```

## Características principales

### Páginas
- **Home (/)**: Dashboard principal con resumen
- **/gastos**: Lista y gestión de gastos
- **/reportes**: Visualización de reportes y estadísticas
- **/presupuestos**: Gestión de presupuestos
- **/auth/login**: Inicio de sesión
- **/auth/register**: Registro de usuarios

### Componentes
- Formularios de gastos
- Tablas de datos
- Gráficas y estadísticas
- Navegación responsive
- Autenticación

## Integración con Backend

El frontend se comunica con el backend a través de la API REST:

```typescript
// Ejemplo de llamada a la API
const gastos = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gastos`);
```

## Despliegue

### Vercel (Recomendado)
```bash
npm run build
vercel deploy
```

### Docker
```bash
docker build -t gastos-frontend .
docker run -p 3001:3001 gastos-frontend
```

## Contribuir
Ver [README.md](../README.md) principal para instrucciones de contribución.
