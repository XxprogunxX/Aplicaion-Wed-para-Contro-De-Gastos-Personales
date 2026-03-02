
/**
 * Middleware de autenticación 
 */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  // Sin token
  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Token requerido',
      status: 401
    });
  }

  // Token inválido
  if (token !== 'Bearer token-valido') {
    return res.status(401).json({
      error: true,
      message: 'Token inválido',
      status: 401
    });
  }

  next();
}

module.exports = authMiddleware;


// TODO: Implementar validación con JWT real en producción

// validateRequest(schema)
// - Validar datos de entrada con Joi o similar
// - Retornar 400 si datos inválidos

// errorHandler
// - Capturar errores
// - Formatear respuesta de error
// - Incluir stack trace solo en desarrollo