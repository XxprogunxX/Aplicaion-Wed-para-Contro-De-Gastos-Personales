/**
 * verifyToken — Valida JWT (firma y expiración).
 * Adjunta req.user = { id, email, role } (+ username si existe en el payload).
 * 401: sin token, token inválido o expirado → { "error": "Unauthorized" }
 */
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwtEnv');

const DEFAULT_ROLE = 'user';

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase() === 'admin' ? 'admin' : DEFAULT_ROLE;
}

function sendUnauthorized(res) {
  return res.status(401).json({ error: 'Unauthorized' });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return sendUnauthorized(res);
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return sendUnauthorized(res);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const rawUserId = payload?.id ?? payload?.sub;

    if (rawUserId === undefined || rawUserId === null || rawUserId === '') {
      return sendUnauthorized(res);
    }

    req.user = {
      id: String(rawUserId),
      email: payload?.email != null ? String(payload.email) : undefined,
      role: normalizeRole(payload?.role),
      username: payload?.username != null ? String(payload.username) : undefined,
    };

    return next();
  } catch {
    return sendUnauthorized(res);
  }
}

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
