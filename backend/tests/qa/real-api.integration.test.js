/**
 * Pruebas de integración QA contra la aplicación Express real (sin mocks).
 * Requiere .env coherente con el entorno que quieras validar.
 */
const request = require('supertest');
const { disconnectRedis } = require('../../src/lib/redis');
const {
  resolveQaCredentials,
  extractCookieHeader,
  getCookieName,
} = require('./qaHelpers');

const app = require('../../src/index');

const creds = resolveQaCredentials();

afterAll(async () => {
  await disconnectRedis();
});

describe('QA — API real (health)', () => {
  it('GET /health responde OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});

if (!creds.ok) {
  describe.skip(`QA — autenticación (omitido: ${creds.reason})`, () => {
    it('configura credenciales de prueba', () => {});
  });
} else {
  const { email, password } = creds;

  describe('QA — autenticación y rutas protegidas (integración real)', () => {
    const cookieName = getCookieName();

    it('POST /api/auth/login rechaza credenciales incorrectas (401)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email,
        password: `${password}_wrong_${Date.now()}`,
      });
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ error: true, status: 401 });
      expect(String(res.body.message || '').toLowerCase()).not.toContain('supabase');
    });

    it('POST /api/auth/login crea sesión: cookie HttpOnly + usuario', async () => {
      const res = await request(app).post('/api/auth/login').send({ email, password });
      expect(res.status).toBe(200);
      expect(res.body.error).toBe(false);
      expect(res.body.data?.user?.email).toBeDefined();
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const joined = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
      expect(joined.toLowerCase()).toContain('httponly');
      expect(joined).toContain(`${cookieName}=`);
    });

    it('GET /api/auth/profile y /api/gastos con cookie (datos reales)', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({ email, password });
      expect(loginRes.status).toBe(200);
      const cookie = extractCookieHeader(loginRes.headers['set-cookie']);
      expect(cookie).toContain(cookieName);

      const profile = await request(app).get('/api/auth/profile').set('Cookie', cookie);
      expect(profile.status).toBe(200);
      expect(profile.body.data?.email || profile.body.data?.id).toBeDefined();

      const gastos = await request(app).get('/api/gastos').set('Cookie', cookie);
      expect(gastos.status).toBe(200);
      expect(Array.isArray(gastos.body.data)).toBe(true);
    });

    it('GET /api/categorias con cookie (consulta real a capa de datos)', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({ email, password });
      const cookie = extractCookieHeader(loginRes.headers['set-cookie']);
      const res = await request(app).get('/api/categorias').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/auth/logout invalida sesión: siguiente request sin cookie falla (401)', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({ email, password });
      expect(loginRes.status).toBe(200);
      const cookie = extractCookieHeader(loginRes.headers['set-cookie']);
      const token = loginRes.body.data?.token;

      const out = await request(app).post('/api/auth/logout').set('Cookie', cookie);
      expect(out.status).toBe(200);

      const blocked = await request(app).get('/api/gastos').set('Cookie', cookie);
      expect(blocked.status).toBe(401);

      if (token) {
        const blockedBearer = await request(app)
          .get('/api/gastos')
          .set('Authorization', `Bearer ${token}`);
        expect(blockedBearer.status).toBe(401);
      }
    });

    it('Authorization Bearer funciona tras login cuando el body incluye token', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({ email, password });
      expect(loginRes.status).toBe(200);
      const token = loginRes.body.data?.token;
      if (!token) {
        expect(String(process.env.AUTH_RETURN_TOKEN_BODY || 'true').toLowerCase()).toBe('false');
        return;
      }
      const res = await request(app)
        .get('/api/gastos')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
}
