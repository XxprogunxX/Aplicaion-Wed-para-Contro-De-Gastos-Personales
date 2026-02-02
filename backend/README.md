# Backend - Control de Gastos Personales

## Tecnologías
- Runtime: Node.js
- Framework: Express.js
- Base de datos: MongoDB
- Lenguaje: JavaScript (ES6+)
- Gestor de paquetes: npm

## Requisitos
- Node.js v18 o superior
- npm
- MongoDB (local o MongoDB Atlas)

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
MONGODB_URI=mongodb://localhost:27017/gastos-personales
JWT_SECRET=tu_clave_secreta_aqui
NODE_ENV=development
```

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
