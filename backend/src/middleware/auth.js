/**
 * Alias retrocompatible: el proyecto usa `require('./middleware/auth')`.
 * Implementación canónica: authMiddleware.js (verifyToken).
 */
module.exports = require('./authMiddleware');
