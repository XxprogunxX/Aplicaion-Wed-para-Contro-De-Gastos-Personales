# Cómo Probar el Backend

Este documento explica cómo probar el backend de la aplicación de control de gastos personales. El backend es una API REST construida con Express.js que maneja operaciones CRUD para gastos, además de un endpoint de salud.

## Prerrequisitos

- **Node.js** versión 16 o superior.
- **npm** (viene con Node.js).
- **Postman** o **curl** para hacer requests HTTP (opcional, pero recomendado para pruebas manuales).
- **Git** para clonar el repositorio (si no lo tienes localmente).

## Instalación

1. Clona el repositorio si no lo tienes:
   ```
   git clone <url-del-repositorio>
   cd Aplicaion-Wed-para-Contro-De-Gastos-Personales
   ```

2. Navega a la carpeta del backend:
   ```
   cd backend
   ```

3. Instala las dependencias:
   ```
   npm install
   ```

4. Crea un archivo `.env` en la carpeta `backend/` con las variables de entorno necesarias (ejemplo en `.env.example`):
   ```
   PORT=3000  # Para evitar conflicto con frontend
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3001  # Origen del frontend
   # Otras variables si las hay (e.g., base de datos)
   ```

## Ejecución del Servidor

1. Para ejecutar en modo desarrollo:
   ```
   npm run dev
   ```
   O directamente:
   ```
   node src/index.js
   ```

2. El servidor debería iniciarse en el puerto especificado (por defecto 3000, o el configurado en `PORT`).

3. Verifica que esté corriendo: abre un navegador y ve a `http://localhost:3000/health` (o el puerto que uses). Deberías ver una respuesta JSON como:
   ```json
   {
     "status": "ok",
     "message": "Servidor ejecutándose"
   }
   ```

## Endpoints Disponibles

El backend expone los siguientes endpoints. Nota: Los endpoints bajo `/api/gastos` requieren autenticación (header `Authorization: Bearer <token>`). Como la autenticación no está implementada aún, para pruebas locales puedes comentar temporalmente el `authMiddleware` en `src/index.js` (línea: `app.use('/api/gastos', authMiddleware, gastosRoutes)` → `app.use('/api/gastos', gastosRoutes)`). Si comentas el middleware, omite el header de Authorization en los ejemplos.

### 1. Health Check
- **GET /health**
- Descripción: Verifica que el servidor esté corriendo.
- Autenticación: No requerida.
- Ejemplo con curl:
  ```
  curl -X GET http://localhost:3000/health
  ```
- Respuesta esperada:
  ```json
  {
    "status": "ok",
    "message": "Servidor ejecutándose"
  }
  ```

### 2. Listar Gastos
- **GET /api/gastos**
- Descripción: Obtiene todos los gastos del usuario autenticado.
- Autenticación: Requerida (pero omite si comentaste el middleware).
- Ejemplo con curl (sin header si auth desactivado):
  ```
  curl -X GET http://localhost:3000/api/gastos
  ```
- Respuesta esperada (éxito):
  ```json
  {
    "error": false,
    "message": "Gastos obtenidos correctamente",
    "data": [
      {
        "id": 1,
        "descripcion": "Comida",
        "monto": 50,
        "categoria": "Alimentación"
      }
    ]
  }
  ```

### 3. Obtener Gasto por ID
- **GET /api/gastos/:id**
- Descripción: Obtiene un gasto específico por su ID.
- Parámetros: `id` (número, en la URL).
- Autenticación: Requerida (pero omite si comentaste el middleware).
- Ejemplo con curl:
  ```
  curl -X GET http://localhost:3000/api/gastos/1
  ```
- Respuesta esperada (éxito):
  ```json
  {
    "error": false,
    "message": "Gasto obtenido correctamente",
    "data": {
      "id": 1,
      "descripcion": "Comida",
      "monto": 50,
      "categoria": "Alimentación"
    }
  }
  ```
- Respuesta de error (gasto no encontrado):
  ```json
  {
    "error": true,
    "message": "Gasto no encontrado",
    "status": 404
  }
  ```

### 4. Crear Gasto
- **POST /api/gastos**
- Descripción: Crea un nuevo gasto.
- Body: JSON con `descripcion` (string), `monto` (number), `categoria` (string).
- Autenticación: Requerida (pero omite si comentaste el middleware).
- Ejemplo con curl:
  ```
  curl -X POST http://localhost:3000/api/gastos \
    -H "Content-Type: application/json" \
    -d '{"descripcion": "Transporte", "monto": 20, "categoria": "Transporte"}'
  ```
- Respuesta esperada (éxito):
  ```json
  {
    "error": false,
    "message": "Gasto creado correctamente",
    "data": {
      "id": 2,
      "descripcion": "Transporte",
      "monto": 20,
      "categoria": "Transporte"
    }
  }
  ```
- Respuesta de error (datos incompletos):
  ```json
  {
    "error": true,
    "message": "Datos incompletos. Se requieren descripción, monto y categoría.",
    "status": 400
  }
  ```

### 5. Actualizar Gasto
- **PUT /api/gastos/:id**
- Descripción: Actualiza un gasto existente.
- Parámetros: `id` (en la URL).
- Body: JSON con campos a actualizar (opcionales: `descripcion`, `monto`, `categoria`).
- Autenticación: Requerida (pero omite si comentaste el middleware).
- Ejemplo con curl:
  ```
  curl -X PUT http://localhost:3000/api/gastos/1 \
    -H "Content-Type: application/json" \
    -d '{"monto": 60}'
  ```
- Respuesta esperada (éxito):
  ```json
  {
    "error": false,
    "message": "Gasto actualizado correctamente",
    "data": {
      "id": 1,
      "descripcion": "Comida",
      "monto": 60,
      "categoria": "Alimentación"
    }
  }
  ```

### 6. Eliminar Gasto
- **DELETE /api/gastos/:id**
- Descripción: Elimina un gasto por ID.
- Parámetros: `id` (en la URL).
- Autenticación: Requerida (pero omite si comentaste el middleware).
- Ejemplo con curl:
  ```
  curl -X DELETE http://localhost:3000/api/gastos/1
  ```
- Respuesta esperada (éxito):
  ```json
  {
    "error": false,
    "message": "Gasto eliminado correctamente"
  }
  ```

## Manejo de Errores

El backend implementa un manejo de errores centralizado para asegurar respuestas consistentes y orientadas al usuario. Todos los errores siguen un formato JSON estándar.

### Formato de Respuestas de Error

Todas las respuestas de error tienen la siguiente estructura:
```json
{
  "error": true,
  "message": "Descripción clara del error, orientada al usuario",
  "status": 400  // Código HTTP correspondiente
}
```

### Tipos de Errores Comunes

- **400 Bad Request**: Datos incompletos o inválidos (e.g., campos faltantes en POST).
- **404 Not Found**: Recurso no encontrado (e.g., gasto con ID inexistente).
- **500 Internal Server Error**: Errores del servidor no controlados.

### Cómo Funciona el Manejo de Errores

1. **En Controladores**: Se usan bloques `try/catch`. Si ocurre un error, se llama a `next(err)` para pasarlo al middleware de errores.
2. **Middleware `errorHandler`**: Captura errores no controlados, registra en consola y responde con el formato estándar.
3. **Middleware `notFoundHandler`**: Maneja rutas inexistentes, respondiendo 404.
4. **Validaciones**: En endpoints como POST/PUT, se validan datos antes de procesar; si faltan, se responde 400 inmediatamente.

### Ejemplos de Errores

- **Ruta inexistente**:
  ```
  curl -X GET http://localhost:3000/api/inexistente
  ```
  Respuesta:
  ```json
  {
    "error": true,
    "message": "Ruta no encontrada",
    "status": 404
  }
  ```

- **Error interno** (simulado lanzando un error en código):
  Respuesta:
  ```json
  {
    "error": true,
    "message": "Error interno del servidor",
    "status": 500
  }
  ```

Para probar errores, intenta enviar datos inválidos o acceder a IDs inexistentes. El backend siempre responde con el formato consistente, facilitando el debugging y la integración con el frontend.

## Pruebas Automatizadas

El backend incluye pruebas con Jest. Para ejecutarlas:

1. Asegúrate de tener las dependencias instaladas.
2. Ejecuta:
   ```
   npm test
   ```
   O en modo watch:
   ```
   npm run test:watch
   ```

Las pruebas cubren controladores, middlewares y rutas. Revisa `backend/tests/` para más detalles.

## Solución de Problemas

- **Error de puerto ocupado**: Cambia el puerto en `.env` (e.g., `PORT=3002`).
- **CORS errors**: Asegúrate de que `CORS_ORIGIN` en `.env` coincida con el origen del frontend.
- **Errores 401/403**: Verifica el token o desactiva auth para pruebas.
- **Servidor no inicia**: Revisa logs en consola; podría ser un problema con dependencias o `.env`.

Si encuentras issues, revisa los logs del servidor o ejecuta `npm run lint` para verificar código.

## Próximos Pasos

Una vez probado el backend, puedes integrar con el frontend configurando `NEXT_PUBLIC_API_URL` en el frontend para apuntar al backend (e.g., `http://localhost:3000`).</content>
<parameter name="filePath">c:\Users\oscar\Desktop\Aplicaion-Wed-para-Contro-De-Gastos-Personales\docs\Como-Probar-el-Backend.md