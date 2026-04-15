/**
 * Rutas admin (especificación): bajo /admin — verifyToken + authorizeRole('admin') en index.js
 */
const express = require('express');
const adminRbacController = require('../controllers/adminRbacController');

const router = express.Router();

router.get('/usuarios', adminRbacController.listUsuarios);
router.delete('/usuarios/:id', adminRbacController.deleteUsuario);
router.post('/config', adminRbacController.postConfig);

module.exports = router;
