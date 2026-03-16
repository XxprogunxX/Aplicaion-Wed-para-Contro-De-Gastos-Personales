const express = require('express');
const router = express.Router();

/**
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Simulación básica de login
  if (email && password) {
    return res.json({
      data: {
        token: "demo-token-123",
        user: {
          email
        }
      }
    });
  }

  return res.status(400).json({
    error: true,
    message: "Credenciales inválidas"
  });
});

/**
 * POST /api/auth/register
 */
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  return res.json({
    data: {
      token: "demo-token-123",
      user: {
        username,
        email
      }
    }
  });
});

module.exports = router;