const request = require('supertest');
const app = require('../src/index');

describe('Auth middleware (API protegida)', () => {
  it('rechaza cuando no hay token', async () => {
    const response = await request(app).get('/api/gastos');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('rechaza cuando el token es invalido', async () => {
    const response = await request(app)
      .get('/api/gastos')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });
});
