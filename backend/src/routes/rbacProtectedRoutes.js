/**
 * Rutas privadas (especificación): GET /perfil, GET /historial — requieren JWT válido.
 * verifyToken solo en estas rutas (no en todo el router) para no interceptar /api/*.
 */
const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const rbacSpecController = require('../controllers/rbacSpecController');

const router = express.Router();

router.get('/perfil', verifyToken, rbacSpecController.getPerfil);
router.get('/historial', verifyToken, rbacSpecController.getHistorial);

module.exports = router;
