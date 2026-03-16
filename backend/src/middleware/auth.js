function authMiddleware(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: true,
      message: "Token requerido",
      status: 401
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({
      error: true,
      message: "Formato de token inválido",
      status: 401
    });
  }

  const scheme = parts[0];
  const token = parts[1];

  if (scheme !== "Bearer") {
    return res.status(401).json({
      error: true,
      message: "Formato de autorización incorrecto",
      status: 401
    });
  }

  // TOKEN QUE DEVUELVE EL LOGIN
  if (token !== "demo-token-123") {
    return res.status(401).json({
      error: true,
      message: "Token inválido",
      status: 401
    });
  }

  next();
}

module.exports = authMiddleware;