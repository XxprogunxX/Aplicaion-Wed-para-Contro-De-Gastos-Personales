/**
 * POST /api/auth/logout — Desactiva sesión, blacklist en Redis, borra cookie.
 * Requiere authMiddleware previo (JWT válido).
 */
const jwt = require('jsonwebtoken');
const { verifySessionToken, verifyLegacyAuthToken, getCookieName, secondsUntilJwtExpiry } = require('../lib/jwt');
const { blacklistJti } = require('../lib/redis');
const { deactivateSession } = require('../lib/sessions');

function isProduction() {
  return process.env.NODE_ENV === 'production';
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

function decodeTokenForTtl(rawToken) {
  try {
    const decoded = verifySessionToken(rawToken);
    return { decoded };
  } catch {
    try {
      const decoded = verifyLegacyAuthToken(rawToken);
      return { decoded };
    } catch {
      const decoded = jwt.decode(rawToken);
      return { decoded };
    }
  }
}

async function logout(req, res) {
  const auth = req.auth;
  const jti = auth?.jti;
  const sessionId = auth?.sessionId;
  const userId = req.user?.id;
  const rawToken = auth?.token;

  if (auth?.legacyDemo) {
    clearSessionCookie(res);
    return res.json({
      error: false,
      message: 'Sesión cerrada correctamente',
      data: { success: true },
    });
  }

  if (!userId || !jti || !rawToken) {
    clearSessionCookie(res);
    return res.status(401).json({
      error: true,
      message: 'No autorizado',
      status: 401,
    });
  }

  try {
    const { decoded } = decodeTokenForTtl(rawToken);
    const ttl = secondsUntilJwtExpiry(decoded);
    await blacklistJti(jti, ttl || 60);

    if (sessionId && !auth?.legacyJwt) {
      await deactivateSession(String(sessionId), String(userId));
    }

    clearSessionCookie(res);

    return res.json({
      error: false,
      message: 'Sesión cerrada correctamente',
      data: { success: true },
    });
  } catch (err) {
    console.error('[auth/logout]', err.message);
    clearSessionCookie(res);
    return res.status(500).json({
      error: true,
      message: 'Error al cerrar sesión',
      status: 500,
    });
  }
}

module.exports = logout;
