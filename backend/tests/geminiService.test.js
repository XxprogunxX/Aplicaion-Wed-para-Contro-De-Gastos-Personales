const {
  generateChatbotReply,
  extractMultipleExpenses,
  __resetChatActionStateForTests,
} = require('../src/services/geminiService');

function toLocalDayKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftedToday(offsetDays) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

function endOfMonthDate(monthOffset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setMonth(date.getMonth() + monthOffset + 1, 0);
  return date;
}

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

  it('limpia markdown con asteriscos en respuestas de IA', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '**Para el videojuego:**\n* **Define un monto:** Decide cuanto quieres gastar.\n* **Crea un presupuesto:** Asigna ese monto.',
                },
              ],
            },
          },
        ],
      }),
    });

    const result = await generateChatbotReply({
      message: 'Quiero planificar una compra',
      history: [],
      user: {
        id: 'user-123',
        username: 'Usuario Demo',
      },
    });

    expect(result.model).toBe('gemini-2.0-flash');
    expect(result.reply).toContain('Para el videojuego:');
    expect(result.reply).toContain('- Define un monto:');
    expect(result.reply).toContain('- Crea un presupuesto:');
    expect(result.reply).not.toContain('**');
    expect(result.reply).not.toContain('\n* ');
  });

  it('no confunde preguntas de consulta con crear gasto cuando incluyen gaste y un anio', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'En enero de 2026 tu total fue $444.00.' }],
            },
          },
        ],
      }),
    });

    const result = await generateChatbotReply({
      message: 'Cuanto gaste en enero de 2026?',
      history: [],
      user: {
        id: 'user-123',
        username: 'Usuario Demo',
      },
    });

    expect(result.model).toBe('gemini-2.0-flash');
    expect(result.reply).toContain('$444.00');
    expect(result.pendingAction).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('trata como consulta historica frases cuanto me gaste esta semana y cuanto llevo gastado', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'Tu gasto acumulado de la semana es $210.00.' }],
            },
          },
        ],
      }),
    });

    const first = await generateChatbotReply({
      message: 'Cuanto me gaste esta semana?',
      history: [],
      user: {
        id: 'user-123',
        username: 'Usuario Demo',
      },
    });

    const second = await generateChatbotReply({
      message: 'Cuanto llevo gastado',
      history: [],
      user: {
        id: 'user-123',
        username: 'Usuario Demo',
      },
    });

    expect(first.model).toBe('gemini-2.0-flash');
    expect(first.reply).toContain('$210.00');
    expect(first.pendingAction).toBeUndefined();

    expect(second.model).toBe('gemini-2.0-flash');
    expect(second.reply).toContain('$210.00');
    expect(second.pendingAction).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('trata como consulta historica frases cuanto va de gasto y como voy de gastos', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'Vas con un total acumulado de $320.00.' }],
            },
          },
        ],
      }),
    });

    const first = await generateChatbotReply({
      message: 'Cuanto va de gasto?',
      history: [],
      user: {
        id: 'user-123',
        username: 'Usuario Demo',
      },
    });

    const second = await generateChatbotReply({
      message: 'Como voy de gastos',
      history: [],
      user: {
        id: 'user-123',
        username: 'Usuario Demo',
      },
    });

    expect(first.model).toBe('gemini-2.0-flash');
    expect(first.reply).toContain('$320.00');
    expect(first.pendingAction).toBeUndefined();

    expect(second.model).toBe('gemini-2.0-flash');
    expect(second.reply).toContain('$320.00');
    expect(second.pendingAction).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('detecta multiples gastos en una sola frase con regex y heuristicas', () => {
    const drafts = extractMultipleExpenses('Gaste 100 en comida, 50 en pasaje y 30 en una cerveza');

    expect(drafts).toHaveLength(3);
    expect(drafts[0]).toEqual(expect.objectContaining({
      descripcion: 'comida',
      monto: 100,
      categoria: 'Alimentacion',
      fecha: expect.any(String),
    }));
    expect(drafts[1]).toEqual(expect.objectContaining({
      descripcion: 'pasaje',
      monto: 50,
      categoria: 'Transporte',
      fecha: expect.any(String),
    }));
    expect(drafts[2]).toEqual(expect.objectContaining({
      descripcion: 'cerveza',
      monto: 30,
      categoria: 'Bebidas',
      fecha: expect.any(String),
    }));

    const expectedToday = toLocalDayKey(shiftedToday(0));
    expect(toLocalDayKey(drafts[0].fecha)).toBe(expectedToday);
    expect(toLocalDayKey(drafts[1].fecha)).toBe(expectedToday);
    expect(toLocalDayKey(drafts[2].fecha)).toBe(expectedToday);
  });

  it('clasifica bebidas de forma consistente para evitar duplicados semanticos', () => {
    const drafts = extractMultipleExpenses('Gaste 25 en refresco y 10 en botella de agua');

    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toEqual(expect.objectContaining({
      descripcion: 'refresco',
      monto: 25,
      categoria: 'Bebidas',
      fecha: expect.any(String),
    }));
    expect(drafts[1]).toEqual(expect.objectContaining({
      descripcion: 'botella de agua',
      monto: 10,
      categoria: 'Bebidas',
      fecha: expect.any(String),
    }));
  });

  it('interpreta ayer, hoy y manana por cada gasto dentro del mismo mensaje', () => {
    const drafts = extractMultipleExpenses(
      'El dia de ayer compre 100 pesos en tacos y hoy me gaste 150 en transporte el dia de manana pretendo gastarme 300 en una cena'
    );

    expect(drafts).toHaveLength(3);
    expect(drafts[0]).toEqual(expect.objectContaining({
      descripcion: 'tacos',
      monto: 100,
      categoria: 'Alimentacion',
      fecha: expect.any(String),
    }));
    expect(drafts[1]).toEqual(expect.objectContaining({
      descripcion: 'transporte',
      monto: 150,
      categoria: 'Transporte',
      fecha: expect.any(String),
    }));
    expect(drafts[2]).toEqual(expect.objectContaining({
      descripcion: 'cena',
      monto: 300,
      categoria: 'Alimentacion',
      fecha: expect.any(String),
    }));

    expect(toLocalDayKey(drafts[0].fecha)).toBe(toLocalDayKey(shiftedToday(-1)));
    expect(toLocalDayKey(drafts[1].fecha)).toBe(toLocalDayKey(shiftedToday(0)));
    expect(toLocalDayKey(drafts[2].fecha)).toBe(toLocalDayKey(shiftedToday(1)));
  });

  it('interpreta meses en texto para asignar la fecha del gasto', () => {
    const drafts = extractMultipleExpenses('En marzo gaste 400 en colegiatura y en enero gaste 200 en internet');

    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toEqual(expect.objectContaining({
      descripcion: 'colegiatura',
      monto: 400,
      categoria: 'Educacion',
      fecha: expect.any(String),
    }));
    expect(drafts[1]).toEqual(expect.objectContaining({
      descripcion: 'internet',
      monto: 200,
      categoria: 'Servicios',
      fecha: expect.any(String),
    }));

    expect(new Date(drafts[0].fecha).getMonth() + 1).toBe(3);
    expect(new Date(drafts[1].fecha).getMonth() + 1).toBe(1);
  });

  it('evita confundir dia y ano de una fecha con montos del gasto', () => {
    const drafts = extractMultipleExpenses('El 5 de marzo de 2024 gaste 100 en tacos');

    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toEqual(expect.objectContaining({
      descripcion: 'tacos',
      monto: 100,
      categoria: 'Alimentacion',
      fecha: expect.any(String),
    }));

    const parsedDate = new Date(drafts[0].fecha);
    expect(parsedDate.getDate()).toBe(5);
    expect(parsedDate.getMonth() + 1).toBe(3);
    expect(parsedDate.getFullYear()).toBe(2024);
  });

  it('interpreta semana pasada y quincena pasada en una misma frase', () => {
    const drafts = extractMultipleExpenses(
      'La semana pasada compre 200 en gasolina y en la quincena pasada me gaste 800 en renta'
    );

    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toEqual(expect.objectContaining({
      descripcion: 'gasolina',
      monto: 200,
      categoria: 'Transporte',
      fecha: expect.any(String),
    }));
    expect(drafts[1]).toEqual(expect.objectContaining({
      descripcion: 'renta',
      monto: 800,
      categoria: 'Servicios',
      fecha: expect.any(String),
    }));

    expect(toLocalDayKey(drafts[0].fecha)).toBe(toLocalDayKey(shiftedToday(-7)));
    expect(toLocalDayKey(drafts[1].fecha)).toBe(toLocalDayKey(shiftedToday(-15)));
  });

  it('interpreta fin de mes como el ultimo dia del mes actual', () => {
    const drafts = extractMultipleExpenses('A fin de mes planeo gastar 300 en una cena');

    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toEqual(expect.objectContaining({
      descripcion: 'cena',
      monto: 300,
      categoria: 'Alimentacion',
      fecha: expect.any(String),
    }));

    expect(toLocalDayKey(drafts[0].fecha)).toBe(toLocalDayKey(endOfMonthDate(0)));
  });

  it('crea y confirma un lote de gastos detectados en un solo mensaje', async () => {
    const pending = await generateChatbotReply({
      message: 'se me fueron 80 en uber y 120 en pizza',
      history: [],
      user: {
        id: 'user-999',
        username: 'Usuario Demo',
      },
    });

    expect(pending.model).toBe('assistant-action-engine');
    expect(pending.reply).toContain('Detecte 2 gastos en tu mensaje');
    expect(pending.reply).toContain('1️⃣ Uber');
    expect(pending.reply).toContain('2️⃣ Pizza');
    expect(pending.pendingAction).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        type: 'create-expense',
      })
    );

    const confirmed = await generateChatbotReply({
      message: '',
      history: [],
      pendingActionId: pending.pendingAction.id,
      actionDecision: 'confirm',
      user: {
        id: 'user-999',
        username: 'Usuario Demo',
      },
    });

    expect(confirmed.model).toBe('assistant-action-engine');
    expect(confirmed.reply).toContain('Registre 2 gastos correctamente');
    expect(confirmed.actionResult).toEqual(
      expect.objectContaining({
        type: 'create-expense',
        status: 'confirmed',
      })
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('crea un presupuesto desde chat cuando detecta intencion', async () => {
    const result = await generateChatbotReply({
      message: 'Crea un presupuesto mensual de Transporte por 600 para marzo 2026',
      history: [],
      user: {
        id: 'user-budget-1',
        username: 'Usuario Demo',
      },
    });

    expect(result.model).toBe('assistant-action-engine');
    expect(result.reply).toContain('Presupuesto registrado correctamente');
    expect(result.reply).toContain('Transporte');
    expect(result.actionResult).toEqual(
      expect.objectContaining({
        type: 'create-budget',
        status: 'confirmed',
      })
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('crea multiples presupuestos desde una lista en un solo mensaje', async () => {
    const result = await generateChatbotReply({
      message: 'Crea presupuestos: Educacion: 2000, Transporte: 600, Videojuegos: 300, Alimentacion: 400',
      history: [],
      user: {
        id: 'user-budget-2',
        username: 'Usuario Demo',
      },
    });

    expect(result.model).toBe('assistant-action-engine');
    expect(result.reply).toContain('Registre 4 presupuestos correctamente');
    expect(result.reply).toContain('Educacion');
    expect(result.reply).toContain('Transporte');
    expect(result.actionResult).toEqual(
      expect.objectContaining({
        type: 'create-budget',
        status: 'confirmed',
      })
    );
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
