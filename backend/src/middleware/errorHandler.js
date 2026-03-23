/**
 * Middleware global de manejo de errores
 * Captura errores no controlados y responde con formato JSON estándar
 * 
 * Debe ser registrado al final de la aplicación, después de todas las rutas
 */
function getSafeErrorMessage(err, status) {
  const rawMessage = String(err?.message || '').trim();
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    err?.type === 'entity.parse.failed' ||
    normalizedMessage.includes('unexpected token') ||
    normalizedMessage.includes('expected property name') ||
    normalizedMessage.includes('json')
  ) {
    return 'JSON inválido en el cuerpo de la solicitud';
  }

  if (status >= 500) {
    return 'Error interno del servidor';
  }

  if (!rawMessage) {
    return 'Solicitud inválida';
  }

  return rawMessage;
}

function errorHandler(err, req, res, _next) {
  // Loguear error en consola para debugging
  console.error(err);

  // Extraer status del error o usar 500 por defecto
  const status = err.status || err.statusCode || (err?.type === 'entity.parse.failed' ? 400 : 500);

  // Mensaje claro y no técnico
  const message = getSafeErrorMessage(err, status);

  // Responder con formato estándar
  res.status(status).json({
    error: true,
    message: message,
    status: status
  });
}

module.exports = errorHandler;
