const request = require('supertest');
const app = require('../src/index');

describe('Auth middleware', () => {
  it('rechaza cuando no hay token', async () => {
    const response = await request(app).get('/api/gastos');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: true,
      message: 'Token requerido',
      status: 401,
    });
  });

  it('rechaza cuando el token es invalido', async () => {
    const response = await request(app)
      .get('/api/gastos')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: true,
      message: 'Token inválido',
      status: 401,
    });
  });
});
