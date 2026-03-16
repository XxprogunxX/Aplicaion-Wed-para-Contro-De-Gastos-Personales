/**
 * Rutas de categorias
 */
const express = require('express');
const router = express.Router();

const categoriasController = require('../controllers/categoriasController');

router.get('/', categoriasController.getAll);
router.post('/', categoriasController.create);
router.put('/:id', categoriasController.update);
router.delete('/:id', categoriasController.deleteCategoria);

module.exports = router;
