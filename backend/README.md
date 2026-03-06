# Backend - Control de Gastos Personales

## Tecnologías
- Runtime: Node.js
- Framework: Express.js
- Base de datos: Supabase (PostgreSQL) / fallback en memoria
- Lenguaje: JavaScript (ES6+)
- Gestor de paquetes: npm

## Requisitos
- Node.js v18 o superior
- npm
- Proyecto de Supabase (opcional en desarrollo si usas fallback en memoria)

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

## Variables de entorno
Crear un archivo `.env` en la raíz del backend con:

```env
PORT=3000
JWT_SECRET=tu_clave_secreta_aqui
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key
```

Usa `SUPABASE_SERVICE_ROLE_KEY` en produccion (recomendado). Si no la tienes aun, puedes usar `SUPABASE_PUBLISHABLE_KEY` de forma temporal.

Si `SUPABASE_URL` y alguna clave de Supabase no estan definidas, el backend usa datos en memoria para desarrollo rapido.

## Ejecutar el servidor

### Modo desarrollo
```bash
npm run dev
```

### Modo producción
```bash
npm start
```

## Scripts disponibles
- `npm start` - Ejecuta el servidor en modo producción
- `npm run dev` - Ejecuta el servidor en modo desarrollo con nodemon
- `npm test` - Ejecuta los tests
- `npm run lint` - Ejecuta el linter

## Estructura del backend
```
backend/
├── src/
│   ├── controllers/     # Controladores de rutas
│   ├── models/         # Modelos de MongoDB
│   ├── routes/         # Definición de rutas
│   ├── middleware/     # Middlewares personalizados
│   ├── utils/          # Utilidades y helpers
│   └── index.js        # Punto de entrada
├── tests/              # Tests unitarios e integración
├── .env.example        # Ejemplo de variables de entorno
├── package.json
└── README.md
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

### Gastos
- `GET /api/gastos` - Obtener todos los gastos del usuario
- `POST /api/gastos` - Crear nuevo gasto
- `GET /api/gastos/:id` - Obtener gasto específico
- `PUT /api/gastos/:id` - Actualizar gasto
- `DELETE /api/gastos/:id` - Eliminar gasto

### Categorías
- `GET /api/categorias` - Obtener todas las categorías
- `POST /api/categorias` - Crear nueva categoría

### Reportes
- `GET /api/reportes/mensual` - Obtener reporte mensual
- `GET /api/reportes/anual` - Obtener reporte anual

## Docker

### Construir imagen
```bash
docker build -t gastos-backend .
```

### Ejecutar contenedor
```bash
docker run -p 3000:3000 --env-file .env gastos-backend
```

## Contribuir
Ver [README.md](../README.md) principal para instrucciones de contribución.
