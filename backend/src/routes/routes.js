/**
 * Rutas de la aplicación
 */
const express = require('express')
const router = express.Router()

// Controladores
const gastosController = require('../controllers/gastosController')

// ==================== RUTAS DE GASTOS ====================

/**
 * GET /api/gastos
 * Obtener todos los gastos del usuario
 */
router.get('/', gastosController.getAll)

/**
 * GET /api/gastos/:id
 * Obtener un gasto específico por ID
 */
router.get('/:id', gastosController.getById)

/**
 * POST /api/gastos
 * Crear nuevo gasto
 * Body: { descripcion, monto, categoria }
 */
router.post('/', gastosController.create)

/**
 * PUT /api/gastos/:id
 * Actualizar gasto existente
 * Body: { descripcion?, monto?, categoria? }
 */
router.put('/:id', gastosController.update)

/**
 * DELETE /api/gastos/:id
 * Eliminar gasto
 */
router.delete('/:id', gastosController.deleteGasto)

module.exports = router
