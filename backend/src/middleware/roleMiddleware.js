/**
 * authorizeRole(rolesPermitidos) — RBAC.
 * Requiere req.user (usar después de verifyToken).
 * 403 si el rol no está en la lista → { "error": "Forbidden" }
 *
 * @param {string|string[]} rolesPermitidos ej. 'admin' o ['admin','user']
 */
function authorizeRole(rolesPermitidos) {
  const permitidos = (
    Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos]
  ).map((r) => String(r || '').trim().toLowerCase());

  return function roleAuthorizationMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rolUsuario = String(req.user.role || 'user').trim().toLowerCase();

    if (!permitidos.includes(rolUsuario)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}

module.exports = { authorizeRole };
module.exports.authorizeRole = authorizeRole;
