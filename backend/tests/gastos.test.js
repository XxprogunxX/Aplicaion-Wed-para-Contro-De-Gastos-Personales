const request = require('supertest');

jest.mock('../src/controllers/gastosController', () => ({
  getAll: jest.fn((req, res) =>
    res.json({
      error: false,
      message: 'Mock gastos',
      data: [
        { id: 1, descripcion: 'Cafe', monto: 10, categoria: 'Alimentacion' },
      ],
    })
  ),
  getById: jest.fn(),
  create: jest.fn((req, res) =>
    res.status(201).json({
      error: false,
      message: 'Mock creado',
      data: { id: 99, ...req.body },
    })
  ),
  update: jest.fn(),
  deleteGasto: jest.fn(),
}));

const app = require('../src/index');
const gastosController = require('../src/controllers/gastosController');

describe('Gastos routes (mocked)', () => {
  it('GET /api/gastos responde datos mock', async () => {
    const response = await request(app)
      .get('/api/gastos')
      .set('Authorization', 'Bearer token-valido');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      error: false,
      message: 'Mock gastos',
      data: [
        { id: 1, descripcion: 'Cafe', monto: 10, categoria: 'Alimentacion' },
      ],
    });
    expect(gastosController.getAll).toHaveBeenCalled();
  });

  it('POST /api/gastos crea gasto mock', async () => {
    const payload = {
      descripcion: 'Internet',
      monto: 45,
      categoria: 'Servicios',
    };

    const response = await request(app)
      .post('/api/gastos')
      .set('Authorization', 'Bearer token-valido')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      error: false,
      message: 'Mock creado',
      data: { id: 99, ...payload },
    });
    expect(gastosController.create).toHaveBeenCalled();
  });
});
