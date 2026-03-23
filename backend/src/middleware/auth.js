/**
 * Autorización: cookie HttpOnly o Bearer, JWT, Redis (blacklist + rate limit), tabla sessions.
 */
const { createHash } = require('crypto');
const {
  extractTokenFromRequest,
  verifySessionToken,
  verifyLegacyAuthToken,
} = require('../lib/jwt');
const { isJtiBlacklisted, isRedisConfigured, consumeRateLimit } = require('../lib/redis');
const { assertActiveSession, touchLastActive } = require('../lib/sessions');

const LEGACY_DEMO_TOKEN = 'token-valido';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

function allowLegacyDemo() {
  return process.env.NODE_ENV === 'test' || process.env.AUTH_ALLOW_LEGACY_DEMO_TOKEN === 'true';
}

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const authedUserWindowSec = parsePositiveInt(process.env.RATE_LIMIT_AUTH_USER_WINDOW_SEC, 60);
const authedUserMax = parsePositiveInt(process.env.RATE_LIMIT_AUTH_USER_MAX, 600);

function stableLegacyJti(userId) {
  return `legacy:${createHash('sha256').update(String(userId)).digest('hex').slice(0, 32)}`;
}

async function enforceAuthenticatedRateLimit(userId) {
  if (!isRedisConfigured()) {
    return true;
  }
  const redisKey = `auth:rl:authed:${String(userId)}`;
  const { allowed } = await consumeRateLimit(redisKey, authedUserMax, authedUserWindowSec);
  return allowed;
}

async function authMiddleware(req, res, next) {
  const token = extractTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Token requerido',
      status: 401,
    });
  }

  if (allowLegacyDemo() && token === LEGACY_DEMO_TOKEN) {
    req.user = {
      id: DEMO_USER_ID,
      email: 'demo@gastos.app',
      username: 'Usuario Demo',
    };
    req.auth = {
      sessionId: null,
      jti: 'legacy-demo',
      token,
      legacyDemo: true,
    };
    return next();
  }

  let payload;
  let mode = 'session';

  try {
    payload = verifySessionToken(token);
  } catch {
    try {
      payload = verifyLegacyAuthToken(token);
      mode = 'legacy';
    } catch {
      return res.status(401).json({
        error: true,
        message: 'Token inválido',
        status: 401,
      });
    }
  }

  const userId = String(payload.sub ?? payload.id ?? '');
  if (!userId) {
    return res.status(401).json({
      error: true,
      message: 'Token inválido',
      status: 401,
    });
  }

  if (mode === 'session') {
    const jti = String(payload.jti || '');
    const sessionId = String(payload.sid || '');

    if (!jti || !sessionId) {
      return res.status(401).json({
        error: true,
        message: 'Token inválido',
        status: 401,
      });
    }

    const blacklisted = await isJtiBlacklisted(jti);
    if (blacklisted) {
      return res.status(401).json({
        error: true,
        message: 'Token inválido',
        status: 401,
      });
    }

    const allowedRl = await enforceAuthenticatedRateLimit(userId);
    if (!allowedRl) {
      return res.status(429).json({
        error: true,
        message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        status: 429,
      });
    }

    const { ok } = await assertActiveSession(sessionId, userId);
    if (!ok) {
      return res.status(401).json({
        error: true,
        message: 'Token inválido',
        status: 401,
      });
    }

    await touchLastActive(sessionId, userId);

    req.user = {
      id: userId,
      email: payload.email,
      username: payload.username,
    };
    req.auth = {
      sessionId,
      jti,
      token,
    };
    return next();
  }

  const legacyJti = stableLegacyJti(userId);
  const blacklistedLegacy = await isJtiBlacklisted(legacyJti);
  if (blacklistedLegacy) {
    return res.status(401).json({
      error: true,
      message: 'Token inválido',
      status: 401,
    });
  }

  const allowedLegacyRl = await enforceAuthenticatedRateLimit(userId);
  if (!allowedLegacyRl) {
    return res.status(429).json({
      error: true,
      message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
      status: 429,
    });
  }

  req.user = {
    id: userId,
    email: payload.email,
    username: payload.username,
  };
  req.auth = {
    sessionId: null,
    jti: legacyJti,
    token,
    legacyJwt: true,
  };

  return next();
}

module.exports = authMiddleware;
