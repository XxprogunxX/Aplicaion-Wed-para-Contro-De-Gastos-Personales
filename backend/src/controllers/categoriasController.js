const { supabase, isSupabaseConfigured } = require('../config/supabase');

const categorias = [
	{ id: 1, nombre: 'Alimentacion', color: '#22c55e', icono: 'utensils', esGlobal: true, userId: null },
	{ id: 2, nombre: 'Transporte', color: '#3b82f6', icono: 'bus', esGlobal: true, userId: null },
	{ id: 3, nombre: 'Servicios', color: '#f97316', icono: 'bolt', esGlobal: true, userId: null }
];

function toNumericIdIfPossible(id) {
	return /^\d+$/.test(String(id)) ? Number(id) : id;
}

function createSupabaseError(error, fallbackMessage, status = 500) {
	return {
		message: error?.message || fallbackMessage,
		status,
	};
}

function getAuthenticatedUserId(req) {
	return req.user?.id;
}

function mapCategoriaFromDb(row) {
	if (!row) {
		return row;
	}

	return {
		...row,
		esGlobal: typeof row.es_global === 'boolean' ? row.es_global : row.esGlobal,
	};
}

async function getAll(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);

		if (isSupabaseConfigured) {
			const { data, error } = await supabase
				.from('categorias')
				.select('*')
				.or(`user_id.eq.${userId},es_global.eq.true`)
				.order('id', { ascending: true });

			if (error) {
				throw createSupabaseError(error, 'No se pudieron obtener las categorias');
			}

			return res.json({
				error: false,
				message: 'Categorias obtenidas correctamente',
				data: (data || []).map(mapCategoriaFromDb),
			});
		}

		res.json({
			error: false,
			message: 'Categorias obtenidas correctamente',
			data: categorias.filter(
				(item) => item.esGlobal || String(item.userId) === String(userId)
			),
		});
	} catch (err) {
		next(err);
	}
}

async function create(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);
		const { nombre, color, icono } = req.body;

		if (!nombre) {
			return res.status(400).json({
				error: true,
				message: 'El campo nombre es obligatorio.',
				status: 400,
			});
		}

		const payload = {
			nombre,
			color: color || '#64748b',
			icono: icono || 'tag',
			es_global: false,
			user_id: userId,
		};

		if (isSupabaseConfigured) {
			const { data, error } = await supabase
				.from('categorias')
				.insert(payload)
				.select('*')
				.limit(1)
				.maybeSingle();

			if (error) {
				throw createSupabaseError(error, 'No se pudo crear la categoria', 400);
			}

			return res.status(201).json({
				error: false,
				message: 'Categoria creada correctamente',
				data: mapCategoriaFromDb(data),
			});
		}

		const nuevaCategoria = {
			id: categorias.length + 1,
			userId,
			nombre: payload.nombre,
			color: payload.color,
			icono: payload.icono,
			esGlobal: payload.es_global,
		};

		categorias.push(nuevaCategoria);

		res.status(201).json({
			error: false,
			message: 'Categoria creada correctamente',
			data: nuevaCategoria,
		});
	} catch (err) {
		next(err);
	}
}

async function update(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);
		const id = toNumericIdIfPossible(req.params.id);
		const { nombre, color, icono } = req.body;

		if (isSupabaseConfigured) {
			const updates = {};
			if (typeof nombre !== 'undefined') {
				updates.nombre = nombre;
			}
			if (typeof color !== 'undefined') {
				updates.color = color;
			}
			if (typeof icono !== 'undefined') {
				updates.icono = icono;
			}
			const { data, error } = await supabase
				.from('categorias')
				.update(updates)
				.eq('id', id)
				.eq('user_id', userId)
				.select('*');

			if (error) {
				throw createSupabaseError(error, 'No se pudo actualizar la categoria', 400);
			}

			const categoriaActualizada = data?.[0];

			if (!categoriaActualizada) {
				return res.status(404).json({
					error: true,
					message: 'Categoria no encontrada',
					status: 404,
				});
			}

			return res.json({
				error: false,
				message: 'Categoria actualizada correctamente',
				data: mapCategoriaFromDb(categoriaActualizada),
			});
		}

		const categoria = categorias.find(
			(item) => item.id === id && String(item.userId) === String(userId)
		);

		if (!categoria) {
			return res.status(404).json({
				error: true,
				message: 'Categoria no encontrada',
				status: 404,
			});
		}

		if (typeof nombre !== 'undefined') {
			categoria.nombre = nombre;
		}
		if (typeof color !== 'undefined') {
			categoria.color = color;
		}
		if (typeof icono !== 'undefined') {
			categoria.icono = icono;
		}
		res.json({
			error: false,
			message: 'Categoria actualizada correctamente',
			data: categoria,
		});
	} catch (err) {
		next(err);
	}
}

async function deleteCategoria(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);
		const id = toNumericIdIfPossible(req.params.id);

		if (isSupabaseConfigured) {
			const { data, error } = await supabase
				.from('categorias')
				.delete()
				.eq('id', id)
				.eq('user_id', userId)
				.select('id');

			if (error) {
				throw createSupabaseError(error, 'No se pudo eliminar la categoria', 400);
			}

			if (!data || data.length === 0) {
				return res.status(404).json({
					error: true,
					message: 'Categoria no encontrada',
					status: 404,
				});
			}

			return res.json({
				error: false,
				message: 'Categoria eliminada correctamente',
			});
		}

		const index = categorias.findIndex(
			(item) => item.id === id && String(item.userId) === String(userId)
		);

		if (index === -1) {
			return res.status(404).json({
				error: true,
				message: 'Categoria no encontrada',
				status: 404,
			});
		}

		categorias.splice(index, 1);

		res.json({
			error: false,
			message: 'Categoria eliminada correctamente',
		});
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getAll,
	create,
	update,
	deleteCategoria,
};
