/**
 * POST /api/auth/login — Valida credenciales, crea sesión, cookie HttpOnly y JWT.
 */
const bcrypt = require('bcryptjs');
const { createAuthSession, clearSessionCookie } = require('../lib/authSession');
const { signInWithPassword, isSupabaseConfigured } = require('../lib/supabase');
const { getClientIp } = require('../middleware/rateLimit');

const LEGACY_USERS = (() => {
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
  return [
    {
      id: DEMO_USER_ID,
      username: 'Usuario Demo',
      email: 'demo@gastos.app',
      passwordHash: bcrypt.hashSync('123456', 10),
      createdAt: new Date().toISOString(),
    },
  ];
})();

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function findLocalUserByEmail(email) {
  return LEGACY_USERS.find((u) => u.email === email);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function shouldReturnTokenInBody() {
  return String(process.env.AUTH_RETURN_TOKEN_BODY || 'true').toLowerCase() !== 'false';
}

function deviceInfoFromRequest(req) {
  const fromBody = req.body?.device_info;
  if (fromBody && String(fromBody).trim()) {
    return String(fromBody).trim().slice(0, 2048);
  }
  const ua = req.headers['user-agent'];
  return ua ? String(ua).slice(0, 2048) : '';
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        error: true,
        message: 'email y password son requeridos',
        status: 400,
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        error: true,
        message: 'Formato de email inválido',
        status: 400,
      });
    }

    const ip = getClientIp(req);
    const deviceInfo = deviceInfoFromRequest(req);

    let profile = null;

    if (isSupabaseConfigured) {
      const { user, error } = await signInWithPassword(normalizedEmail, String(password));

      if (error || !user) {
        clearSessionCookie(res);
        return res.status(401).json({
          error: true,
          message: 'Credenciales inválidas',
          status: 401,
        });
      }

      const metaName = user.user_metadata?.username;
      profile = {
        id: user.id,
        username: metaName || normalizedEmail.split('@')[0],
        email: normalizeEmail(user.email),
        createdAt: user.created_at || new Date().toISOString(),
      };
    } else {
      const local = findLocalUserByEmail(normalizedEmail);
      const ok = local?.passwordHash && bcrypt.compareSync(String(password), local.passwordHash);
      if (!local || !ok) {
        clearSessionCookie(res);
        return res.status(401).json({
          error: true,
          message: 'Credenciales inválidas',
          status: 401,
        });
      }
      profile = sanitizeUser(local);
    }

    const sessionResult = await createAuthSession(res, {
      userId: profile.id,
      email: profile.email,
      username: profile.username,
      deviceInfo,
      ipAddress: ip,
    });

    if (sessionResult.error || !sessionResult.token) {
      console.error('[auth/login] session create failed:', sessionResult.error?.message);
      clearSessionCookie(res);
      return res.status(503).json({
        error: true,
        message: 'No se pudo iniciar sesión en este momento',
        status: 503,
      });
    }

    const payload = {
      error: false,
      message: 'Inicio de sesión correcto',
      data: {
        user: profile,
      },
    };

    if (shouldReturnTokenInBody()) {
      payload.data.token = sessionResult.token;
    }

    return res.json(payload);
  } catch (err) {
    console.error('[auth/login]', err.message);
    clearSessionCookie(res);
    return res.status(500).json({
      error: true,
      message: 'Error interno al iniciar sesión',
      status: 500,
    });
  }
}

module.exports = login;
