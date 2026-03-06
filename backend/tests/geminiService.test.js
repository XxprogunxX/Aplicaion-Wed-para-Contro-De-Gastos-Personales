const {
  generateChatbotReply,
  __resetChatActionStateForTests,
} = require('../src/services/geminiService');

describe('geminiService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_MODEL;
    global.fetch = jest.fn();
    __resetChatActionStateForTests();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    delete global.fetch;
    jest.clearAllMocks();
  });

  it('degrada a respuesta local cuando Gemini reporta cuota agotada', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue({
        error: {
          message: 'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests',
        },
      }),
    });

    const result = await generateChatbotReply({
      message: 'Como ahorro mas este mes?',
      history: [],
      user: {
        username: 'Usuario Demo',
      },
    });

    expect(result.model).toBe('fallback-local');
    expect(result.reply).toContain('no esta disponible por limite de cuota');
    expect(result.reply).toContain('Define un tope diario');
    expect(result.createdAt).toEqual(expect.any(String));
  });

  it('usa Groq cuando Gemini reporta cuota agotada y GROQ_API_KEY existe', async () => {
    process.env.GROQ_API_KEY = 'groq-test-key';
    process.env.GROQ_MODEL = 'llama-3.1-8b-instant';

    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Puedes ahorrar revisando tus gastos hormiga diarios.',
              },
            },
          ],
        }),
      });

    const result = await generateChatbotReply({
      message: 'Dame un consejo para ahorrar esta semana',
      history: [],
      user: {
        username: 'Usuario Demo',
      },
    });

    expect(result.model).toBe('groq:llama-3.1-8b-instant');
    expect(result.reply).toContain('ahorrar');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toContain('/models/');
    expect(global.fetch.mock.calls[1][0]).toContain('/chat/completions');
  });

  it('usa Groq cuando GEMINI_API_KEY no esta configurada', async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.GROQ_API_KEY = 'groq-test-key';
    process.env.GROQ_MODEL = 'llama-3.1-8b-instant';

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Te conviene fijar un limite diario para gastos variables.',
            },
          },
        ],
      }),
    });

    const result = await generateChatbotReply({
      message: 'Que hago para gastar menos?',
      history: [],
      user: {
        username: 'Usuario Demo',
      },
    });

    expect(result.model).toBe('groq:llama-3.1-8b-instant');
    expect(result.reply).toContain('limite diario');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('/chat/completions');
  });

  it('mantiene el error cuando no es un problema de cuota', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({
        error: {
          message: 'Internal model error',
        },
      }),
    });

    await expect(
      generateChatbotReply({
        message: 'Necesito ayuda con mi presupuesto',
        history: [],
        user: {
          username: 'Usuario Demo',
        },
      })
    ).rejects.toMatchObject({
      status: 502,
      message: 'Internal model error',
    });
  });

  it('crea una accion pendiente al detectar solicitud de nuevo gasto', async () => {
    const result = await generateChatbotReply({
      message: 'Agrega gasto descripcion: Taxi, monto: 120, categoria: Transporte',
      history: [],
      user: {
        id: 'user-123',
        username: 'Usuario Demo',
      },
    });

    expect(result.model).toBe('assistant-action-engine');
    expect(result.pendingAction).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        type: 'create-expense',
        descripcion: 'Taxi',
        monto: 120,
        categoria: 'Transporte',
      })
    );
    expect(result.reply).toContain('CONFIRMAR');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('confirma accion pendiente y registra gasto sin llamar a Gemini', async () => {
    const pending = await generateChatbotReply({
      message: 'Agrega gasto descripcion: Cafe, monto: 45, categoria: Alimentacion',
      history: [],
      user: {
        id: 'user-123',
        username: 'Usuario Demo',
      },
    });

    const result = await generateChatbotReply({
      message: '',
      history: [],
      user: {
        id: 'user-123',
        username: 'Usuario Demo',
      },
      pendingActionId: pending.pendingAction.id,
      actionDecision: 'confirm',
    });

    expect(result.model).toBe('assistant-action-engine');
    expect(result.reply).toContain('Gasto registrado correctamente');
    expect(result.actionResult).toEqual(
      expect.objectContaining({
        type: 'create-expense',
        status: 'confirmed',
      })
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('confirma usando la ultima accion pendiente sin requerir id en el mensaje', async () => {
    await generateChatbotReply({
      message: 'Agrega gasto descripcion: Pan, monto: 30, categoria: Alimentacion',
      history: [],
      user: {
        id: 'user-456',
        username: 'Usuario Demo',
      },
    });

    const result = await generateChatbotReply({
      message: 'Confirmar',
      history: [],
      user: {
        id: 'user-456',
        username: 'Usuario Demo',
      },
    });

    expect(result.reply).toContain('Gasto registrado correctamente');
    expect(result.reply).not.toContain('ID:');
    expect(result.actionResult).toEqual(
      expect.objectContaining({
        type: 'create-expense',
        status: 'confirmed',
      })
    );
  });
});
