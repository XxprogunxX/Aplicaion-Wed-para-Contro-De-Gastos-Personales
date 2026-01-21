// TODO: Implementar cliente API con Axios

// Configurar axios con baseURL y headers
// Agregar interceptor para tokens JWT

// API de Autenticación
// - login(email, password)
// - register(username, email, password)
// - logout()

// API de Gastos
// - getAll() - GET /api/gastos
// - getById(id) - GET /api/gastos/:id
// - create(gasto) - POST /api/gastos
// - update(id, gasto) - PUT /api/gastos/:id
// - delete(id) - DELETE /api/gastos/:id

// API de Categorías
// - getAll() - GET /api/categorias
// - create(categoria) - POST /api/categorias

// API de Presupuestos
// - getAll() - GET /api/presupuestos
// - create(presupuesto) - POST /api/presupuestos

// API de Reportes
// - getMensual(mes, anio) - GET /api/reportes/mensual
// - getAnual(anio) - GET /api/reportes/anual

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
