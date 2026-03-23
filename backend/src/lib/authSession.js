/**
 * Creación de sesión + cookie HttpOnly + JWT (flujo compartido login/register).
 */
const { signSessionToken, getCookieName, getSessionTtlSeconds } = require('./jwt');
const { createSessionRecord } = require('./sessions');

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function appendSessionCookie(res, token, maxAgeSeconds) {
  const cookieName = getCookieName();
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  });
}

function clearSessionCookie(res) {
  const cookieName = getCookieName();
  res.clearCookie(cookieName, {
    path: '/',
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
  });
}

/**
 * @param {import('express').Response} res
 * @param {{ userId: string, email?: string, username?: string, deviceInfo: string, ipAddress: string }} input
 */
async function createAuthSession(res, input) {
  const ttl = getSessionTtlSeconds();
  const expiresAt = new Date(Date.now() + ttl * 1000);

  const { id: sessionId, error } = await createSessionRecord({
    userId: input.userId,
    deviceInfo: input.deviceInfo,
    ipAddress: input.ipAddress,
    expiresAt,
  });

  if (error || !sessionId) {
    return { error: error || new Error('session_create_failed'), token: null, expiresInSeconds: ttl };
  }

  const { token, expiresInSeconds } = signSessionToken({
    userId: input.userId,
    sessionId,
    jti: sessionId,
    email: input.email,
    username: input.username,
  });

  appendSessionCookie(res, token, expiresInSeconds);

  return { error: null, token, expiresInSeconds, sessionId };
}

module.exports = {
  appendSessionCookie,
  clearSessionCookie,
  createAuthSession,
};
