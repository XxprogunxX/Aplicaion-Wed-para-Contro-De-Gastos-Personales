const request = require('supertest')
const app = require('../src/index')

describe('Not found handler', () => {
  it('responde 404 para rutas inexistentes', async () => {
    const response = await request(app).get('/ruta-inexistente')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: true,
      message: 'Ruta no encontrada',
      status: 404,
    })
  })
})
