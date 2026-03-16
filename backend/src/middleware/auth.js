
/**
 * Middleware de autenticación 
 */
const jwt = require('jsonwebtoken');

const LEGACY_DEMO_TOKEN = 'token-valido';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Sin token
  if (!authHeader) {
    return res.status(401).json({
      error: true,
      message: 'Token requerido',
      status: 401
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Token requerido',
      status: 401,
    });
  }

  // Compatibilidad temporal para tests antiguos y modo demo.
  if (token === LEGACY_DEMO_TOKEN) {
    req.user = {
      id: DEMO_USER_ID,
      email: 'demo@gastos.app',
      username: 'Usuario Demo',
    };
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const rawUserId = payload?.id ?? payload?.sub;

    if (typeof rawUserId === 'undefined' || rawUserId === null || rawUserId === '') {
      throw new Error('Token sin identificador de usuario');
    }

    const parsedUserId = String(rawUserId);

    req.user = {
      id: parsedUserId,
      email: payload?.email,
      username: payload?.username,
    };

    return next();
  } catch {
    return res.status(401).json({
      error: true,
      message: 'Token inválido',
      status: 401,
    });
  }

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