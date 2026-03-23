const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
  supabaseKeyMode: 'publishable-or-anon',
}));

const app = require('../src/index');

describe('Auth login route', () => {
  it('POST /api/auth/login inicia sesión y devuelve usuario con rol', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@gastos.app',
        password: '123456',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      error: false,
      message: 'Inicio de sesión correcto',
      data: {
        token: expect.any(String),
        user: {
          email: 'demo@gastos.app',
          username: 'Usuario Demo',
          role: 'user',
        },
      },
    });

    expect(response.body.data.user).not.toHaveProperty('passwordHash');

    const decodedToken = jwt.decode(response.body.data.token);
    expect(decodedToken).toEqual(
      expect.objectContaining({
        email: 'demo@gastos.app',
        username: 'Usuario Demo',
        role: 'user',
      })
    );
  });

  it('POST /api/auth/login valida campos requeridos', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: true,
      message: 'email y password son requeridos',
      status: 400,
    });
  });

  it('POST /api/auth/login rechaza credenciales inválidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@gastos.app',
        password: 'incorrecta',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: true,
      message: 'Credenciales inválidas',
      status: 401,
    });
  });
});