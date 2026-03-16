/**
 * Rutas de presupuestos
 */
const express = require('express');
const router = express.Router();

const presupuestosController = require('../controllers/presupuestosController');

router.get('/', presupuestosController.getAll);
router.get('/estado', presupuestosController.getEstado);
router.post('/', presupuestosController.create);
router.put('/:id', presupuestosController.update);
router.delete('/:id', presupuestosController.deletePresupuesto);

module.exports = router;
