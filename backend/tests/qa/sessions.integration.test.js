/**
 * Tests de sesión (integración real): JWT sid/jti, cookie, revocación, filas en Supabase (opcional).
 */
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { supabase, isSupabaseConfigured } = require('../../src/config/supabase');
const { disconnectRedis } = require('../../src/lib/redis');
const {
  resolveQaCredentials,
  extractCookieHeader,
  extractSessionJwtFromLoginResponse,
  getCookieName,
} = require('./qaHelpers');

const app = require('../../src/index');

const creds = resolveQaCredentials();

afterAll(async () => {
  await disconnectRedis();
});

if (!creds.ok) {
  describe.skip(`QA — sesiones (omitido: ${creds.reason})`, () => {
    it('configura credenciales de prueba', () => {});
  });
} else {
  const { email, password } = creds;
  const cookieName = getCookieName();

  describe('QA — sesiones (JWT, cookie, revocación)', () => {
    it('el JWT de sesión incluye sid, jti, sub y exp futuro; sid coincide con jti', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({ email, password });
      expect(loginRes.status).toBe(200);
      const token = extractSessionJwtFromLoginResponse(loginRes);
      expect(token.length).toBeGreaterThan(20);
      const payload = jwt.decode(token);
      expect(payload).toBeTruthy();
      expect(payload.sub).toBeTruthy();
      expect(payload.sid).toBeTruthy();
      expect(payload.jti).toBeTruthy();
      expect(payload.sid).toBe(payload.jti);
      expect(typeof payload.exp).toBe('number');
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('cada login crea una sesión distinta (sid diferente)', async () => {
      const a = await request(app).post('/api/auth/login').send({ email, password });
      const b = await request(app).post('/api/auth/login').send({ email, password });
      expect(a.status).toBe(200);
      expect(b.status).toBe(200);
      const ta = extractSessionJwtFromLoginResponse(a);
      const tb = extractSessionJwtFromLoginResponse(b);
      const pa = jwt.decode(ta);
      const pb = jwt.decode(tb);
      expect(pa.sid).not.toBe(pb.sid);
    });

    it('tras logout el token anterior no autoriza; un login nuevo sí', async () => {
      const first = await request(app).post('/api/auth/login').send({ email, password });
      expect(first.status).toBe(200);
      const cookieOld = extractCookieHeader(first.headers['set-cookie']);
      const tokenOld = extractSessionJwtFromLoginResponse(first);

      await request(app).post('/api/auth/logout').set('Cookie', cookieOld).expect(200);

      await request(app).get('/api/gastos').set('Cookie', cookieOld).expect(401);
      if (tokenOld) {
        await request(app)
          .get('/api/gastos')
          .set('Authorization', `Bearer ${tokenOld}`)
          .expect(401);
      }

      const second = await request(app).post('/api/auth/login').send({ email, password });
      expect(second.status).toBe(200);
      const cookieNew = extractCookieHeader(second.headers['set-cookie']);
      await request(app).get('/api/gastos').set('Cookie', cookieNew).expect(200);
    });

    it('cookie y Bearer con el mismo JWT permiten el mismo acceso a /api/gastos', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({ email, password });
      expect(loginRes.status).toBe(200);
      const token = extractSessionJwtFromLoginResponse(loginRes);
      const cookie = extractCookieHeader(loginRes.headers['set-cookie']);
      expect(cookie).toContain(cookieName);

      const withCookie = await request(app).get('/api/gastos').set('Cookie', cookie);
      expect(withCookie.status).toBe(200);

      if (!token) {
        expect(String(process.env.AUTH_RETURN_TOKEN_BODY || 'true').toLowerCase()).toBe('false');
        return;
      }

      const withBearer = await request(app)
        .get('/api/gastos')
        .set('Authorization', `Bearer ${token}`);
      expect(withBearer.status).toBe(200);
    });

    it('dos peticiones autenticadas seguidas responden 200 (sesión sigue activa)', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({ email, password });
      const cookie = extractCookieHeader(loginRes.headers['set-cookie']);
      await request(app).get('/api/gastos').set('Cookie', cookie).expect(200);
      await request(app).get('/api/auth/profile').set('Cookie', cookie).expect(200);
    });
  });

  const verifyRow = String(process.env.QA_VERIFY_SESSION_ROW || '').toLowerCase() === '1';

  if (verifyRow && isSupabaseConfigured && supabase) {
    describe('QA — sesiones (fila en Supabase, opcional QA_VERIFY_SESSION_ROW=1)', () => {
      it('login crea fila activa; logout pone is_active en false', async () => {
        const loginRes = await request(app).post('/api/auth/login').send({ email, password });
        expect(loginRes.status).toBe(200);
        const token = extractSessionJwtFromLoginResponse(loginRes);
        const payload = jwt.decode(token);
        const sessionId = payload?.sid;
        expect(sessionId).toBeTruthy();

        const { data: activeRow, error: e1 } = await supabase
          .from('sessions')
          .select('id,is_active,expires_at,user_id')
          .eq('id', sessionId)
          .maybeSingle();

        expect(e1).toBeNull();
        expect(activeRow).toBeTruthy();
        expect(activeRow.is_active).toBe(true);
        expect(new Date(activeRow.expires_at).getTime()).toBeGreaterThan(Date.now());

        const cookie = extractCookieHeader(loginRes.headers['set-cookie']);
        await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(200);

        const { data: inactiveRow, error: e2 } = await supabase
          .from('sessions')
          .select('id,is_active')
          .eq('id', sessionId)
          .maybeSingle();

        expect(e2).toBeNull();
        expect(inactiveRow?.is_active).toBe(false);
      });
    });
  }
}
