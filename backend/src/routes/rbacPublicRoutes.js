/**
 * Rutas públicas (especificación): POST /login, POST /registro
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/registro', authController.register);

module.exports = router;
