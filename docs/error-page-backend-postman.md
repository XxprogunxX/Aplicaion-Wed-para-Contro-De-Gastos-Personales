# Validación de errores Backend – Postman

## Rama
features/error-page

## Objetivo
Validar el manejo de errores del backend utilizando Postman.

## Prueba 1 – Conexión al backend

**Request**
GET http://localhost:3000/

**Resultado**
Error: ECONNREFUSED

**Conclusión**
El backend no se encuentra activo ni escuchando en el puerto 3000.

---

## Prueba 2 – Ruta inexistente (404)

**Request**
GET http://localhost:3000/no-existe

**Resultado**
No se obtiene respuesta debido a que el servidor no está activo.

**Conclusión**
No es posible validar el error 404 en esta etapa.

---

## Prueba 3 – Error interno (500)

**Request**
GET http://localhost:3000/force500

**Resultado**
No se obtiene respuesta.

**Conclusión**
No es posible validar el error 500 mientras el backend no esté implementado.

---

## Observaciones
El archivo `backend/src/index.js` no tiene implementado el servidor Express, por lo que el contenedor Docker se detiene inmediatamente.

Las pruebas quedan pendientes hasta que el backend sea completado por el responsable correspondiente.
