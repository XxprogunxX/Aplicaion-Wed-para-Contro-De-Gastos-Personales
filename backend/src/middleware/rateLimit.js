/**
 * Rate limiting con Redis (ventana fija). Sin Redis, no limita.
 */
const crypto = require('crypto');
const { consumeRateLimit, isRedisConfigured } = require('../lib/redis');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  const raw = req.ip || req.socket?.remoteAddress || '';
  return String(raw);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function hashEmail(email) {
  return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function createRedisRateLimiter({ name, windowSeconds, max, buildKey }) {
  return async function rateLimitMiddleware(req, res, next) {
    if (!isRedisConfigured()) {
      return next();
    }

    try {
      const keySuffix = buildKey(req);
      const redisKey = `auth:rl:${name}:${keySuffix}`;
      const { allowed, count } = await consumeRateLimit(redisKey, max, windowSeconds);

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - count)));

      if (!allowed) {
        return res.status(429).json({
          error: true,
          message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
          status: 429,
        });
      }

      return next();
    } catch (err) {
      console.error('[rateLimit]', err.message);
      return next();
    }
  };
}

const loginIpWindowSec = parsePositiveInt(process.env.RATE_LIMIT_LOGIN_IP_WINDOW_SEC, 900);
const loginIpMax = parsePositiveInt(process.env.RATE_LIMIT_LOGIN_IP_MAX, 30);

const loginEmailWindowSec = parsePositiveInt(process.env.RATE_LIMIT_LOGIN_EMAIL_WINDOW_SEC, 900);
const loginEmailMax = parsePositiveInt(process.env.RATE_LIMIT_LOGIN_EMAIL_MAX, 10);

const apiIpWindowSec = parsePositiveInt(process.env.RATE_LIMIT_API_IP_WINDOW_SEC, 60);
const apiIpMax = parsePositiveInt(process.env.RATE_LIMIT_API_IP_MAX, 300);

/** Limita intentos de login por IP */
const loginRateLimitByIp = createRedisRateLimiter({
  name: 'login-ip',
  windowSeconds: loginIpWindowSec,
  max: loginIpMax,
  buildKey: (req) => getClientIp(req),
});

/**
 * Limita por email (hash) en login. Debe ejecutarse después de express.json.
 */
const loginRateLimitByEmail = createRedisRateLimiter({
  name: 'login-email',
  windowSeconds: loginEmailWindowSec,
  max: loginEmailMax,
  buildKey: (req) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return `empty:${getClientIp(req)}`;
    }
    return `email:${hashEmail(email)}`;
  },
});

/** Límite amplio por IP en toda la API (opcional, se monta en index) */
const apiRateLimitByIp = createRedisRateLimiter({
  name: 'api-ip',
  windowSeconds: apiIpWindowSec,
  max: apiIpMax,
  buildKey: (req) => getClientIp(req),
});

module.exports = {
  getClientIp,
  loginRateLimitByIp,
  loginRateLimitByEmail,
  apiRateLimitByIp,
  createRedisRateLimiter,
};
