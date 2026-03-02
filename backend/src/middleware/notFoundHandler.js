/**
 * Middleware para manejar rutas no encontradas (404)
 * Debe registrarse al final, después de todas las rutas
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: true,
    message: 'Ruta no encontrada',
    status: 404
  });
}

module.exports = notFoundHandler;
