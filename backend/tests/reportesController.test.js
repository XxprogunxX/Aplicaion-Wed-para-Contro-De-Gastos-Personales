describe('reportesController (date-only parsing)', () => {
  let mockOrder;
  let mockEq;
  let mockSelect;
  let mockFrom;
  let reportesController;

  function createMockRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  }

  beforeEach(() => {
    jest.resetModules();

    mockOrder = jest.fn();
    mockEq = jest.fn(() => ({
      order: mockOrder,
    }));
    mockSelect = jest.fn(() => ({
      eq: mockEq,
    }));
    mockFrom = jest.fn(() => ({
      select: mockSelect,
    }));

    jest.doMock('../src/config/supabase', () => ({
      isSupabaseConfigured: true,
      supabase: {
        from: mockFrom,
      },
    }));

    reportesController = require('../src/controllers/reportesController');
  });

  it('agrupa correctamente por mes cuando fecha viene como YYYY-MM-DD', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 1,
          descripcion: 'Gasolina',
          monto: 200,
          categoria: 'Transporte',
          fecha: '2026-02-28',
        },
        {
          id: 2,
          descripcion: 'Cena',
          monto: 300,
          categoria: 'Alimentacion',
          fecha: '2026-03-01',
        },
      ],
      error: null,
    });

    const req = {
      user: { id: 'user-1' },
      query: { anio: '2026' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await reportesController.getAnual(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);

    const payload = res.json.mock.calls[0][0];
    expect(payload.error).toBe(false);
    expect(payload.data.totalGastado).toBe(500);
    expect(payload.data.gastosPorMes['2']).toBe(200);
    expect(payload.data.gastosPorMes['3']).toBe(300);
  });

  it('filtra correctamente reporte mensual con fechas YYYY-MM-DD', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 1,
          descripcion: 'Gasolina',
          monto: 200,
          categoria: 'Transporte',
          fecha: '2026-02-28',
        },
        {
          id: 2,
          descripcion: 'Cena',
          monto: 300,
          categoria: 'Alimentacion',
          fecha: '2026-03-01',
        },
      ],
      error: null,
    });

    const req = {
      user: { id: 'user-1' },
      query: { mes: '3', anio: '2026' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await reportesController.getMensual(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);

    const payload = res.json.mock.calls[0][0];
    expect(payload.error).toBe(false);
    expect(payload.data.totalGastado).toBe(300);
    expect(payload.data.cantidadGastos).toBe(1);
    expect(payload.data.gastos).toHaveLength(1);
    expect(payload.data.gastos[0].descripcion).toBe('Cena');
  });
});
