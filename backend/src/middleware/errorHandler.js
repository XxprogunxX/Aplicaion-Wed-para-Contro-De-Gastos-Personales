/**
 * Middleware global de manejo de errores
 * Captura errores no controlados y responde con formato JSON estándar
 * 
 * Debe ser registrado al final de la aplicación, después de todas las rutas
 */
function errorHandler(err, req, res, next) {
  // Loguear error en consola para debugging
  console.error(err);

  // Extraer status del error o usar 500 por defecto
  const status = err.status || err.statusCode || 500;

  // Mensaje claro y no técnico
  const message = err.message || 'Error interno del servidor';

  // Responder con formato estándar
  res.status(status).json({
    error: true,
    message: message,
    status: status
  });
}

module.exports = errorHandler;
