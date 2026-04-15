const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/auth');

describe('Auth Middleware - Validación de tokens', () => {
  let app;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const validUserId = 'user-456';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;

    // Crear app test
    app = express();
    app.use(express.json());

    // Ruta protegida
    app.get('/api/protected', authMiddleware, (req, res) => {
      res.json({ message: 'Acceso permitido', userId: req.user?.id });
    });
  });

  test('Petición sin Authorization header debe retornar 401', async () => {
    const res = await request(app).get('/api/protected');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe(true);
    expect(res.body.message).toBe('Token requerido');
  });

  test('Token válido debe permitir acceso', async () => {
    const validToken = jwt.sign(
      { id: validUserId },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Acceso permitido');
  });

  test('Token expirado debe retornar 401', async () => {
    const expiredToken = jwt.sign(
      { id: validUserId },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe(true);
  });

  test('Bearer token con formato incorrecto debe retornar 401', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Invalidtoken123');

    expect(res.status).toBe(401);
  });

  test('Token con firma inválida debe retornar 401', async () => {
    const invalidToken = jwt.sign(
      { id: validUserId },
      'wrong-secret',
      { expiresIn: '12h' }
    );

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(res.status).toBe(401);
  });

  test('Authorization vacío debe retornar 401', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', '');

    expect(res.status).toBe(401);
  });

  test('Authorization solo "Bearer" sin token debe retornar 401', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
  });
});
