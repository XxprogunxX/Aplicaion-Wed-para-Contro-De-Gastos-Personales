
/**
 * Middleware de autenticación 
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const DEFAULT_ROLE = 'user';

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase() === 'admin' ? 'admin' : DEFAULT_ROLE;
}

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
      role: normalizeRole(payload?.role),
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
