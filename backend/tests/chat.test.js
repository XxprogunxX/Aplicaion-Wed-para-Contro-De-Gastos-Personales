const request = require('supertest');
const { buildAuthHeader } = require('./helpers/authToken');

jest.mock('../src/services/geminiService', () => ({
  generateChatbotReply: jest.fn().mockResolvedValue({
    reply: 'Te recomiendo revisar gastos variables primero.',
    model: 'gemini-test',
    createdAt: '2026-03-06T00:00:00.000Z',
  }),
  getPendingActionForUser: jest.fn().mockReturnValue(null),
}));

jest.mock('../src/services/chatHistoryService', () => ({
  appendChatMessagesForUser: jest.fn().mockResolvedValue([]),
  getChatHistoryForUser: jest.fn().mockResolvedValue([]),
}));

const app = require('../src/index');
const { generateChatbotReply, getPendingActionForUser } = require('../src/services/geminiService');
const { appendChatMessagesForUser, getChatHistoryForUser } = require('../src/services/chatHistoryService');

describe('Chat route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generateChatbotReply.mockResolvedValue({
      reply: 'Te recomiendo revisar gastos variables primero.',
      model: 'gemini-test',
      createdAt: '2026-03-06T00:00:00.000Z',
    });
    getPendingActionForUser.mockReturnValue(null);
    getChatHistoryForUser.mockResolvedValue([]);
    appendChatMessagesForUser.mockResolvedValue([]);
  });

  it('POST /api/chat responde mensaje del asistente', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', buildAuthHeader())
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
        role: 'user',
      },
    });

    expect(appendChatMessagesForUser).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      [
        { role: 'user', content: 'Como puedo ahorrar mas este mes?' },
        {
          role: 'assistant',
          content: 'Te recomiendo revisar gastos variables primero.',
          createdAt: '2026-03-06T00:00:00.000Z',
        },
      ]
    );
  });

  it('POST /api/chat valida message requerido', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', buildAuthHeader())
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
      .set('Authorization', buildAuthHeader())
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
        role: 'user',
      },
    });

    expect(appendChatMessagesForUser).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      [
        {
          role: 'assistant',
          content: 'Te recomiendo revisar gastos variables primero.',
          createdAt: '2026-03-06T00:00:00.000Z',
        },
      ]
    );
  });

  it('GET /api/chat/history devuelve historial y accion pendiente', async () => {
    getChatHistoryForUser.mockResolvedValue([
      {
        role: 'user',
        content: 'Hola',
        createdAt: '2026-03-05T10:00:00.000Z',
      },
      {
        role: 'assistant',
        content: 'Hola, en que te ayudo?',
        createdAt: '2026-03-05T10:00:02.000Z',
      },
    ]);
    getPendingActionForUser.mockReturnValue({
      id: 'accion-1',
      type: 'create-expense',
      descripcion: 'Cafe',
      monto: 35,
      categoria: 'Alimentacion',
      expiresAt: '2026-03-05T11:00:00.000Z',
    });

    const response = await request(app)
      .get('/api/chat/history')
      .set('Authorization', buildAuthHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      error: false,
      message: 'Historial obtenido correctamente',
      data: {
        messages: [
          {
            role: 'user',
            content: 'Hola',
            createdAt: '2026-03-05T10:00:00.000Z',
          },
          {
            role: 'assistant',
            content: 'Hola, en que te ayudo?',
            createdAt: '2026-03-05T10:00:02.000Z',
          },
        ],
        pendingAction: {
          id: 'accion-1',
          type: 'create-expense',
          descripcion: 'Cafe',
          monto: 35,
          categoria: 'Alimentacion',
          expiresAt: '2026-03-05T11:00:00.000Z',
        },
      },
    });

    expect(getChatHistoryForUser).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      { limit: 50 }
    );
    expect(getPendingActionForUser).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001');
  });
});
