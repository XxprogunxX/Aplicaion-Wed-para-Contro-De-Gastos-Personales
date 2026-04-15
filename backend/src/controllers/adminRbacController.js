/**
 * Admin RBAC: /admin/* (solo rol admin tras verifyToken).
 */
const authController = require('./authController');

function listUsuarios(_req, res) {
	const usuarios = authController.listLocalUsersSanitized();
	return res.status(200).json({ data: { usuarios, total: usuarios.length } });
}

function deleteUsuario(req, res) {
	const { id } = req.params;
	const result = authController.removeLocalUserById(id);

	if (result.ok) {
		return res.status(200).json({ data: { eliminado: true, id: String(id) } });
	}

	if (result.reason === 'not_found') {
		return res.status(404).json({ error: 'Not Found' });
	}

	return res.status(403).json({ error: 'Forbidden' });
}

function postConfig(req, res) {
	// Stub: en producción validar body y persistir configuración autorizada.
	const body = req.body && typeof req.body === 'object' ? req.body : {};
	return res.status(200).json({
		data: {
			aplicado: true,
			recibido: Object.keys(body).length > 0,
		},
	});
}

module.exports = {
	listUsuarios,
	deleteUsuario,
	postConfig,
};
