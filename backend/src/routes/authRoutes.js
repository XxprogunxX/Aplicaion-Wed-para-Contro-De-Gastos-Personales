/**
 * Rutas de autenticación
 */
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/logout
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * GET /api/auth/profile
 */
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
