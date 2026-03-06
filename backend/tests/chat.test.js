const request = require('supertest');

jest.mock('../src/services/geminiService', () => ({
  generateChatbotReply: jest.fn().mockResolvedValue({
    reply: 'Te recomiendo revisar gastos variables primero.',
    model: 'gemini-test',
    createdAt: '2026-03-06T00:00:00.000Z',
  }),
}));

const app = require('../src/index');
const { generateChatbotReply } = require('../src/services/geminiService');

describe('Chat route', () => {
  it('POST /api/chat responde mensaje del asistente', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: 'Como puedo ahorrar mas este mes?' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      error: false,
      message: 'Respuesta generada correctamente',
      data: {
        reply: 'Te recomiendo revisar gastos variables primero.',
        model: 'gemini-test',
        createdAt: '2026-03-06T00:00:00.000Z',
      },
    });

    expect(generateChatbotReply).toHaveBeenCalledWith({
      message: 'Como puedo ahorrar mas este mes?',
      history: [],
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo@gastos.app',
        username: 'Usuario Demo',
      },
    });
  });

  it('POST /api/chat valida message requerido', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer token-valido')
      .send({ message: '  ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: true,
      message: 'message es requerido cuando no hay una accion pendiente',
      status: 400,
    });
  });

  it('POST /api/chat permite confirmar accion pendiente sin mensaje', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer token-valido')
      .send({
        pendingActionId: 'accion-demo-1',
        actionDecision: 'confirm',
      });

    expect(response.status).toBe(200);
    expect(generateChatbotReply).toHaveBeenCalledWith({
      message: '',
      history: [],
      pendingActionId: 'accion-demo-1',
      actionDecision: 'confirm',
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo@gastos.app',
        username: 'Usuario Demo',
      },
    });
  });
});
