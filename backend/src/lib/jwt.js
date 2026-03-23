/**
 * JWT por dispositivo/sesión: firma, verificación y extracción desde petición.
 */
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session_token';

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret || secret === 'dev_jwt_secret_change_me') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set to a strong value in production');
    }
  }
  return secret || 'dev_jwt_secret_change_me';
}

function getIssuer() {
  return process.env.JWT_ISSUER || 'gastos-personales-api';
}

function getAudience() {
  return process.env.JWT_AUDIENCE || 'gastos-personales-clients';
}

function getSessionTtlSeconds() {
  const raw = Number(process.env.SESSION_TTL_SECONDS);
  if (Number.isFinite(raw) && raw > 60) {
    return Math.floor(raw);
  }
  return 12 * 60 * 60;
}

/**
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.sessionId UUID de fila sessions.id
 * @param {string} [params.email]
 * @param {string} [params.username]
 */
function signSessionToken(params) {
  const secret = getJwtSecret();
  const ttl = getSessionTtlSeconds();
  const jti = params.jti || params.sessionId || randomUUID();

  const payload = {
    sub: String(params.userId),
    sid: String(params.sessionId),
    jti,
    email: params.email,
    username: params.username,
  };

  return {
    token: jwt.sign(payload, secret, {
      expiresIn: ttl,
      issuer: getIssuer(),
      audience: getAudience(),
    }),
    jti,
    expiresInSeconds: ttl,
  };
}

function verifySessionToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret, {
    issuer: getIssuer(),
    audience: getAudience(),
  });
}

/** Tokens emitidos antes de issuer/audience/jti (compatibilidad). */
function verifyLegacyAuthToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

function extractBearer(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') {
    return null;
  }
  const trimmed = headerValue.replace(/^Bearer\s+/i, '').trim();
  return trimmed || null;
}

/**
 * Cookie HttpOnly primero; si no, Authorization Bearer.
 */
function extractTokenFromRequest(req) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken && String(cookieToken).trim()) {
    return String(cookieToken).trim();
  }
  return extractBearer(req.headers?.authorization);
}

function getCookieName() {
  return COOKIE_NAME;
}

function secondsUntilJwtExpiry(decoded) {
  if (decoded?.exp && typeof decoded.exp === 'number') {
    return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
  }
  return getSessionTtlSeconds();
}

module.exports = {
  signSessionToken,
  verifySessionToken,
  verifyLegacyAuthToken,
  extractBearer,
  extractTokenFromRequest,
  getCookieName,
  getSessionTtlSeconds,
  secondsUntilJwtExpiry,
};
