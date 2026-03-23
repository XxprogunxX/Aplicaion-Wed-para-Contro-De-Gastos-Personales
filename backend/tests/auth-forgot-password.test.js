const request = require('supertest');

jest.mock('../src/config/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
  supabaseKeyMode: 'publishable-or-anon',
}));

const app = require('../src/index');

describe('Auth forgot password route', () => {
  it('POST /api/auth/forgot-password valida email requerido', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: true,
      message: 'email es requerido',
      status: 400,
    });
  });

  it('POST /api/auth/forgot-password valida formato de email', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'correo-invalido' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: true,
      message: 'Formato de email inválido',
      status: 400,
    });
  });

  it('POST /api/auth/forgot-password responde éxito genérico para evitar enumeración', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'demo@gastos.app' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      error: false,
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
      data: { sent: true },
    });
  });
});