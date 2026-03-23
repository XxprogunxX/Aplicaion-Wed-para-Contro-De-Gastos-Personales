#!/usr/bin/env node
/**
 * Smoke QA contra un servidor HTTP real (no in-process).
 * Uso:
 *   node scripts/qa/http-smoke.mjs
 *   QA_BASE_URL=https://api.tu-dominio.com QA_TEST_EMAIL=... QA_TEST_PASSWORD=... node scripts/qa/http-smoke.mjs
 *
 * Códigos de salida: 0 OK, 1 fallo.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '..', '.env') });

const baseUrl = String(process.env.QA_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const sessionCookieName = String(process.env.AUTH_COOKIE_NAME || 'session_token').trim() || 'session_token';

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function sessionJwtFromLogin(loginJson, cookieHeader) {
  const fromBody = loginJson?.data?.token;
  if (fromBody && String(fromBody).trim()) {
    return String(fromBody).trim();
  }
  if (!cookieHeader) {
    return '';
  }
  const re = new RegExp(`${sessionCookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`);
  const m = cookieHeader.match(re);
  return m ? decodeURIComponent(m[1].trim()) : '';
}

function isSupabaseConfigured() {
  const url = String(process.env.SUPABASE_URL || '').trim();
  const key = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      ''
  ).trim();
  return Boolean(url && key);
}

function credentials() {
  if (isSupabaseConfigured()) {
    const email = String(process.env.QA_TEST_EMAIL || '').trim();
    const password = String(process.env.QA_TEST_PASSWORD || '').trim();
    if (!email || !password) {
      console.error(
        '[qa:smoke] Con Supabase en .env, define QA_TEST_EMAIL y QA_TEST_PASSWORD.'
      );
      process.exit(1);
    }
    return { email, password };
  }
  return { email: 'demo@gastos.app', password: '123456' };
}

function cookieHeaderFromSetCookie(setCookie) {
  if (!setCookie?.length) {
    return '';
  }
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  return list
    .map((c) => String(c).split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

async function assertOk(name, condition, detail = '') {
  if (!condition) {
    console.error(`[qa:smoke] FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
    process.exit(1);
  }
  console.log(`[qa:smoke] OK: ${name}`);
}

function isConnectionRefused(err) {
  const code = err?.cause?.code ?? err?.code;
  return code === 'ECONNREFUSED';
}

function printConnectionRefusedHelp() {
  console.error('');
  console.error('[qa:smoke] No hay servidor HTTP escuchando en esa dirección (ECONNREFUSED).');
  console.error(`[qa:smoke] URL usada: ${baseUrl}`);
  console.error('[qa:smoke] Solución:');
  console.error('  1) En otra terminal, desde la carpeta backend:  npm start');
  console.error('  2) O indica otra URL/puerto:  $env:QA_BASE_URL="http://127.0.0.1:PUERTO"');
  console.error('[qa:smoke] Nota: este script no arranca el API; solo lo prueba por red.');
  console.error('[qa:smoke] Para pruebas sin servidor levantado usa:  npm run test:qa');
  console.error('');
}

async function main() {
  const { email, password } = credentials();

  console.error(`[qa:smoke] Probando API en ${baseUrl}`);

  const health = await fetch(`${baseUrl}/health`);
  await assertOk('GET /health', health.ok, `status ${health.status}`);

  const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: `bad_${password}_${Date.now()}` }),
  });
  await assertOk('POST /api/auth/login credenciales inválidas', badLogin.status === 401);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await login.json().catch(() => ({}));
  await assertOk('POST /api/auth/login', login.ok, `status ${login.status}`);
  await assertOk('login body tiene usuario', Boolean(loginJson?.data?.user));

  const setCookieList =
    typeof login.headers.getSetCookie === 'function'
      ? login.headers.getSetCookie()
      : (() => {
          const single = login.headers.get('set-cookie');
          return single ? [single] : [];
        })();
  const cookie = cookieHeaderFromSetCookie(setCookieList);
  await assertOk('Set-Cookie presente', cookie.length > 0, cookie || 'sin cookies');

  const jwt1 = sessionJwtFromLogin(loginJson, cookie);
  await assertOk('JWT de sesión extraíble (body o cookie)', jwt1.length > 20);
  const p1 = decodeJwtPayload(jwt1);
  await assertOk('JWT payload tiene sid, jti, sub', Boolean(p1?.sid && p1?.jti && p1?.sub));
  await assertOk('sid y jti coinciden', p1.sid === p1.jti);

  const login2 = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginJson2 = await login2.json().catch(() => ({}));
  const set2 =
    typeof login2.headers.getSetCookie === 'function'
      ? login2.headers.getSetCookie()
      : (() => {
          const single = login2.headers.get('set-cookie');
          return single ? [single] : [];
        })();
  const cookie2 = cookieHeaderFromSetCookie(set2);
  const jwt2 = sessionJwtFromLogin(loginJson2, cookie2);
  const p2 = decodeJwtPayload(jwt2);
  await assertOk('segundo login genera otra sesión (sid distinto)', p1.sid !== p2?.sid);

  const profile = await fetch(`${baseUrl}/api/auth/profile`, {
    headers: { Cookie: cookie },
  });
  const profileJson = await profile.json().catch(() => ({}));
  await assertOk('GET /api/auth/profile', profile.ok, `status ${profile.status}`);
  await assertOk(
    'perfil con datos',
    Boolean(profileJson?.data?.email || profileJson?.data?.id)
  );

  const gastos = await fetch(`${baseUrl}/api/gastos`, {
    headers: { Cookie: cookie },
  });
  const gastosJson = await gastos.json().catch(() => ({}));
  await assertOk('GET /api/gastos', gastos.ok, `status ${gastos.status}`);
  await assertOk('gastos es array', Array.isArray(gastosJson?.data));

  const logout = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  await assertOk('POST /api/auth/logout', logout.ok, `status ${logout.status}`);

  const after = await fetch(`${baseUrl}/api/gastos`, {
    headers: { Cookie: cookie },
  });
  await assertOk('GET /api/gastos tras logout = 401', after.status === 401);

  console.log('[qa:smoke] Todas las comprobaciones pasaron.');
}

main().catch((err) => {
  if (isConnectionRefused(err)) {
    printConnectionRefusedHelp();
    process.exit(1);
  }
  console.error('[qa:smoke] Error:', err);
  process.exit(1);
});
