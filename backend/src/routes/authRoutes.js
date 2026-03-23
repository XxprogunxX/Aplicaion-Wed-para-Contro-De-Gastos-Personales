/**
 * Rutas de autenticación
 */
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const loginHandler = require('../auth/login');
const logoutHandler = require('../auth/logout');
const { loginRateLimitByIp, loginRateLimitByEmail } = require('../middleware/rateLimit');

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', loginRateLimitByIp, loginRateLimitByEmail, loginHandler);

/**
 * POST /api/auth/logout
 */
router.post('/logout', authMiddleware, logoutHandler);

/**
 * GET /api/auth/profile
 */
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
