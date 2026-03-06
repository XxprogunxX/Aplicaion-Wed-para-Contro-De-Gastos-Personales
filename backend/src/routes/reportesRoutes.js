/**
 * Rutas de reportes
 */
const express = require('express');
const router = express.Router();

const reportesController = require('../controllers/reportesController');

router.get('/mensual', reportesController.getMensual);
router.get('/anual', reportesController.getAnual);
router.get('/categorias', reportesController.getPorCategoria);
router.get('/comparativo', reportesController.getComparativo);

module.exports = router;
