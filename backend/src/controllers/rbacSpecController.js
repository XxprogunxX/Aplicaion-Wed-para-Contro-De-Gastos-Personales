/**
 * Handlers de la especificación RBAC: GET /perfil, GET /historial
 * (rutas al nivel raíz del servidor, no bajo /api/auth).
 */
function getPerfil(req, res) {
	const u = req.user;
	if (!u) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	return res.status(200).json({
		data: {
			id: u.id,
			email: u.email || '',
			role: u.role,
			...(u.username ? { username: u.username } : {}),
		},
	});
}

function getHistorial(req, res) {
	if (!req.user) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Punto de extensión: enlazar con gastos/historial real vía servicio.
	return res.status(200).json({
		data: {
			userId: req.user.id,
			items: [],
			meta: { fuente: 'stub', mensaje: 'Historial disponible para integración con /api/gastos' },
		},
	});
}

module.exports = {
	getPerfil,
	getHistorial,
};
