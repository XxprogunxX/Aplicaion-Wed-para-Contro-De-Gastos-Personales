const request = require('supertest')
const app = require('../src/index')

describe('Health check', () => {
  it('responde con status ok', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      message: 'Servidor ejecutándose',
    })
  })
})
