/**
 * Cliente Redis singleton: blacklist de JWT y rate limiting.
 * Si REDIS_URL no está definido, las operaciones son no-op (sin bloquear el arranque).
 */
const { createClient } = require('redis');

let client = null;
let connecting = null;

function isRedisConfigured() {
  return Boolean(String(process.env.REDIS_URL || '').trim());
}

async function getRedis() {
  if (!isRedisConfigured()) {
    return null;
  }

  if (client?.isOpen) {
    return client;
  }

  if (!connecting) {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
    });

    client.on('error', (err) => {
      console.error('[redis] error:', err.message);
    });

    connecting = client
      .connect()
      .then(() => client)
      .catch((err) => {
        console.error('[redis] connect failed:', err.message);
        client = null;
        connecting = null;
        return null;
      });
  }

  return connecting;
}

function blacklistKey(jti) {
  return `auth:blacklist:jti:${jti}`;
}

/**
 * @param {string} jti
 * @param {number} ttlSeconds TTL hasta expiración natural del JWT
 */
async function blacklistJti(jti, ttlSeconds) {
  const redis = await getRedis();
  if (!redis || !jti) {
    return;
  }
  const ttl = Math.max(1, Math.ceil(ttlSeconds));
  await redis.set(blacklistKey(jti), '1', { EX: ttl });
}

async function isJtiBlacklisted(jti) {
  const redis = await getRedis();
  if (!redis || !jti) {
    return false;
  }
  try {
    const v = await redis.get(blacklistKey(jti));
    return v === '1';
  } catch (err) {
    console.error('[redis] blacklist read failed:', err.message);
    return false;
  }
}

/**
 * Ventana fija: INCR + EXPIRE en el primer incremento.
 * @returns {Promise<{ allowed: boolean, count: number }>}
 */
async function consumeRateLimit(redisKey, max, windowSeconds) {
  const redis = await getRedis();
  if (!redis) {
    return { allowed: true, count: 0 };
  }
  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, Math.max(1, windowSeconds));
    }
    return { allowed: count <= max, count };
  } catch (err) {
    console.error('[redis] rate limit failed:', err.message);
    return { allowed: true, count: 0 };
  }
}

async function disconnectRedis() {
  try {
    if (client?.isOpen) {
      await client.quit();
    }
  } catch {
    // ignore
  }
  client = null;
  connecting = null;
}

module.exports = {
  isRedisConfigured,
  getRedis,
  blacklistJti,
  isJtiBlacklisted,
  consumeRateLimit,
  disconnectRedis,
};
