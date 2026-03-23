/**
 * Utilidades compartidas para suites QA (integración real).
 */
const { isSupabaseConfigured } = require('../../src/config/supabase');
const { getCookieName } = require('../../src/lib/jwt');

function resolveQaCredentials() {
  if (isSupabaseConfigured) {
    const email = String(process.env.QA_TEST_EMAIL || '').trim();
    const password = String(process.env.QA_TEST_PASSWORD || '').trim();
    if (!email || !password) {
      return {
        ok: false,
        reason:
          'Con Supabase configurado definen QA_TEST_EMAIL y QA_TEST_PASSWORD (usuario real de prueba).',
      };
    }
    return { ok: true, email, password };
  }
  return {
    ok: true,
    email: 'demo@gastos.app',
    password: '123456',
  };
}

function extractCookieHeader(setCookie) {
  if (!setCookie || !setCookie.length) {
    return '';
  }
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  return parts
    .map((c) => String(c).split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

/**
 * Token JWT desde body o desde la cookie de sesión (cuando no hay token en JSON).
 */
function extractSessionJwtFromLoginResponse(loginRes) {
  const fromBody = loginRes.body?.data?.token;
  if (fromBody && String(fromBody).trim()) {
    return String(fromBody).trim();
  }
  const cookieHeader = extractCookieHeader(loginRes.headers['set-cookie']);
  const name = getCookieName();
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = cookieHeader.match(new RegExp(`${escaped}=([^;]+)`));
  return m ? decodeURIComponent(m[1].trim()) : '';
}

module.exports = {
  getCookieName,
  resolveQaCredentials,
  extractCookieHeader,
  extractSessionJwtFromLoginResponse,
};
