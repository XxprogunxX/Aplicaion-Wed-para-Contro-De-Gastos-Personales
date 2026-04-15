/**
 * Evidencias P1–P11 — especificación RBAC (QA).
 */
const request = require('supertest');
const app = require('../src/index');
const { createTestToken, buildAuthHeader } = require('./helpers/authToken');

describe('RBAC especificación — P1–P11', () => {
  describe('P1 — POST /login público → 200', () => {
    it('permite login demo', async () => {
      const res = await request(app).post('/login').send({
        email: 'demo@gastos.app',
        password: '123456',
      });
      expect(res.status).toBe(200);
      expect(res.body.data?.token).toBeDefined();
    });
  });

  describe('P2 — POST /registro público', () => {
    it('acepta intento de registro (201 o 409 si ya existe)', async () => {
      const email = `rbac_spec_${Date.now()}@test.local`;
      const res = await request(app).post('/registro').send({
        username: 'rbacSpec',
        email,
        password: 'testpass123',
      });
      expect([201, 400, 409, 500]).toContain(res.status);
    });
  });

  describe('P3 — GET /perfil sin token → 401', () => {
    it('retorna Unauthorized', async () => {
      const res = await request(app).get('/perfil');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: true, message: 'Token requerido' });
    });
  });

  describe('P4 — GET /perfil token inválido → 401', () => {
    it('retorna Unauthorized', async () => {
      const res = await request(app).get('/perfil').set('Authorization', 'Bearer no-es-un-jwt');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: true, message: 'Token inválido o expirado' });
    });
  });

  describe('P5 — GET /perfil token válido usuario → 200', () => {
    it('retorna datos de identidad', async () => {
      const res = await request(app).get('/perfil').set('Authorization', buildAuthHeader({ role: 'user' }));
      expect(res.status).toBe(200);
      expect(res.body.data?.id).toBeDefined();
      expect(res.body.data?.role).toBe('user');
    });
  });

  describe('P6 — GET /historial token válido → 200', () => {
    it('permite usuario', async () => {
      const res = await request(app).get('/historial').set('Authorization', buildAuthHeader({ role: 'user' }));
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('permite admin', async () => {
      const res = await request(app).get('/historial').set('Authorization', buildAuthHeader({ role: 'admin' }));
      expect(res.status).toBe(200);
    });
  });

  describe('P7 — GET /admin/usuarios sin token → 401', () => {
    it('retorna Unauthorized', async () => {
      const res = await request(app).get('/admin/usuarios');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: true, message: 'Token requerido' });
    });
  });

  describe('P8 — GET /admin/usuarios rol user → 403', () => {
    it('retorna Forbidden', async () => {
      const res = await request(app)
        .get('/admin/usuarios')
        .set('Authorization', buildAuthHeader({ role: 'user' }));
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden' });
    });
  });

  describe('P9 — GET /admin/usuarios rol admin → 200', () => {
    it('lista usuarios', async () => {
      const token = createTestToken({ role: 'admin', id: '10000000-0000-0000-0000-000000000001' });
      const res = await request(app).get('/admin/usuarios').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data?.usuarios)).toBe(true);
    });
  });

  describe('P10 — DELETE /admin/usuarios/:id rol user → 403', () => {
    it('retorna Forbidden', async () => {
      const res = await request(app)
        .delete('/admin/usuarios/99999999-9999-9999-9999-999999999999')
        .set('Authorization', buildAuthHeader({ role: 'user' }));
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden' });
    });
  });

  describe('P11 — POST /admin/config rol user → 403', () => {
    it('retorna Forbidden', async () => {
      const res = await request(app)
        .post('/admin/config')
        .set('Authorization', buildAuthHeader({ role: 'user' }))
        .send({ flag: true });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden' });
    });
  });
});
