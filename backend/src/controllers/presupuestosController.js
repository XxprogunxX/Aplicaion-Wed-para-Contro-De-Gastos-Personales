const { supabase, isSupabaseConfigured } = require('../config/supabase');
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const presupuestos = [
	{
		id: 1,
		userId: DEMO_USER_ID,
		categoria: 'Alimentacion',
		monto: 500,
		periodo: 'mensual',
		mes: new Date().getMonth() + 1,
		anio: new Date().getFullYear(),
	},
];

const gastosFallback = [
	{
		id: 1,
		userId: DEMO_USER_ID,
		descripcion: 'Comida',
		monto: 50,
		categoria: 'Alimentacion',
		fecha: new Date().toISOString(),
	},
	{
		id: 2,
		userId: DEMO_USER_ID,
		descripcion: 'Bus',
		monto: 20,
		categoria: 'Transporte',
		fecha: new Date().toISOString(),
	},
];

function toNumericIdIfPossible(id) {
	return /^\d+$/.test(String(id)) ? Number(id) : id;
}

function toNumber(value) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
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

function resolveDate(value) {
	if (!value) {
		return null;
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function isGastoWithinPresupuestoPeriod(gasto, presupuesto) {
	const date = resolveDate(gasto.fecha || gasto.created_at);

	if (!date) {
		return false;
	}

	const anioPresupuesto = Number(presupuesto.anio);
	if (Number.isFinite(anioPresupuesto) && anioPresupuesto > 0 && date.getFullYear() !== anioPresupuesto) {
		return false;
	}

	if (presupuesto.periodo === 'mensual') {
		const mesPresupuesto = Number(presupuesto.mes);
		if (!Number.isFinite(mesPresupuesto) || mesPresupuesto < 1 || mesPresupuesto > 12) {
			return false;
		}

		return date.getMonth() + 1 === mesPresupuesto;
	}

	return true;
}

function buildEstado(presupuestosData, gastosData) {
	return (presupuestosData || []).map((presupuesto) => {
		const montoPresupuesto = toNumber(presupuesto.monto);

		const gastado = (gastosData || []).reduce((total, gasto) => {
			if (gasto.categoria !== presupuesto.categoria) {
				return total;
			}

			if (!isGastoWithinPresupuestoPeriod(gasto, presupuesto)) {
				return total;
			}

			return total + toNumber(gasto.monto);
		}, 0);

		const porcentajeUsado = montoPresupuesto > 0
			? Number(((gastado / montoPresupuesto) * 100).toFixed(2))
			: 0;

		return {
			...presupuesto,
			gastado,
			disponible: montoPresupuesto - gastado,
			porcentajeUsado,
			excedido: gastado > montoPresupuesto,
		};
	});
}

async function getAll(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);

		if (isSupabaseConfigured) {
			const { data, error } = await supabase
				.from('presupuestos')
				.select('*')
				.eq('user_id', userId)
				.order('id', { ascending: true });

			if (error) {
				throw createSupabaseError(error, 'No se pudieron obtener los presupuestos');
			}

			return res.json({
				error: false,
				message: 'Presupuestos obtenidos correctamente',
				data: data || [],
			});
		}

		res.json({
			error: false,
			message: 'Presupuestos obtenidos correctamente',
			data: presupuestos.filter((item) => String(item.userId) === String(userId)),
		});
	} catch (err) {
		next(err);
	}
}

async function create(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);
		const { categoria, monto, periodo, mes, anio } = req.body;

		if (!categoria || typeof monto === 'undefined' || !periodo) {
			return res.status(400).json({
				error: true,
				message: 'Datos incompletos. Se requieren categoria, monto y periodo.',
				status: 400,
			});
		}

		const payload = {
			categoria,
			monto: toNumber(monto),
			periodo,
			mes: typeof mes === 'undefined' ? null : Number(mes),
			anio: Number(anio || new Date().getFullYear()),
			user_id: userId,
		};

		if (isSupabaseConfigured) {
			const { data, error } = await supabase
				.from('presupuestos')
				.insert(payload)
				.select('*')
				.limit(1)
				.maybeSingle();

			if (error) {
				throw createSupabaseError(error, 'No se pudo crear el presupuesto', 400);
			}

			return res.status(201).json({
				error: false,
				message: 'Presupuesto creado correctamente',
				data,
			});
		}

		const nuevoPresupuesto = {
			id: presupuestos.length + 1,
			userId,
			categoria: payload.categoria,
			monto: payload.monto,
			periodo: payload.periodo,
			mes: payload.mes,
			anio: payload.anio,
		};

		presupuestos.push(nuevoPresupuesto);

		res.status(201).json({
			error: false,
			message: 'Presupuesto creado correctamente',
			data: nuevoPresupuesto,
		});
	} catch (err) {
		next(err);
	}
}

async function update(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);
		const id = toNumericIdIfPossible(req.params.id);
		const { categoria, monto, periodo, mes, anio } = req.body;

		if (isSupabaseConfigured) {
			const updates = {};
			if (typeof categoria !== 'undefined') {
				updates.categoria = categoria;
			}
			if (typeof monto !== 'undefined') {
				updates.monto = toNumber(monto);
			}
			if (typeof periodo !== 'undefined') {
				updates.periodo = periodo;
			}
			if (typeof mes !== 'undefined') {
				updates.mes = Number(mes);
			}
			if (typeof anio !== 'undefined') {
				updates.anio = Number(anio);
			}

			const { data, error } = await supabase
				.from('presupuestos')
				.update(updates)
				.eq('id', id)
				.eq('user_id', userId)
				.select('*');

			if (error) {
				throw createSupabaseError(error, 'No se pudo actualizar el presupuesto', 400);
			}

			const presupuestoActualizado = data?.[0];

			if (!presupuestoActualizado) {
				return res.status(404).json({
					error: true,
					message: 'Presupuesto no encontrado',
					status: 404,
				});
			}

			return res.json({
				error: false,
				message: 'Presupuesto actualizado correctamente',
				data: presupuestoActualizado,
			});
		}

		const presupuesto = presupuestos.find(
			(item) => item.id === id && String(item.userId) === String(userId)
		);

		if (!presupuesto) {
			return res.status(404).json({
				error: true,
				message: 'Presupuesto no encontrado',
				status: 404,
			});
		}

		if (typeof categoria !== 'undefined') {
			presupuesto.categoria = categoria;
		}
		if (typeof monto !== 'undefined') {
			presupuesto.monto = toNumber(monto);
		}
		if (typeof periodo !== 'undefined') {
			presupuesto.periodo = periodo;
		}
		if (typeof mes !== 'undefined') {
			presupuesto.mes = Number(mes);
		}
		if (typeof anio !== 'undefined') {
			presupuesto.anio = Number(anio);
		}

		res.json({
			error: false,
			message: 'Presupuesto actualizado correctamente',
			data: presupuesto,
		});
	} catch (err) {
		next(err);
	}
}

async function deletePresupuesto(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);
		const id = toNumericIdIfPossible(req.params.id);

		if (isSupabaseConfigured) {
			const { data, error } = await supabase
				.from('presupuestos')
				.delete()
				.eq('id', id)
				.eq('user_id', userId)
				.select('id');

			if (error) {
				throw createSupabaseError(error, 'No se pudo eliminar el presupuesto', 400);
			}

			if (!data || data.length === 0) {
				return res.status(404).json({
					error: true,
					message: 'Presupuesto no encontrado',
					status: 404,
				});
			}

			return res.json({
				error: false,
				message: 'Presupuesto eliminado correctamente',
			});
		}

		const index = presupuestos.findIndex(
			(item) => item.id === id && String(item.userId) === String(userId)
		);

		if (index === -1) {
			return res.status(404).json({
				error: true,
				message: 'Presupuesto no encontrado',
				status: 404,
			});
		}

		presupuestos.splice(index, 1);

		res.json({
			error: false,
			message: 'Presupuesto eliminado correctamente',
		});
	} catch (err) {
		next(err);
	}
}

async function getEstado(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);

		if (isSupabaseConfigured) {
			const [presupuestosResult, gastosResult] = await Promise.all([
				supabase.from('presupuestos').select('*').eq('user_id', userId),
				supabase.from('gastos').select('categoria,monto,fecha,created_at').eq('user_id', userId),
			]);

			if (presupuestosResult.error) {
				throw createSupabaseError(
					presupuestosResult.error,
					'No se pudo obtener el estado de presupuestos'
				);
			}

			if (gastosResult.error) {
				throw createSupabaseError(gastosResult.error, 'No se pudieron obtener los gastos');
			}

			const estado = buildEstado(presupuestosResult.data || [], gastosResult.data || []);

			return res.json({
				error: false,
				message: 'Estado de presupuestos obtenido correctamente',
				data: estado,
			});
		}

		const estado = buildEstado(
			presupuestos.filter((item) => String(item.userId) === String(userId)),
			gastosFallback.filter((item) => String(item.userId) === String(userId))
		);

		res.json({
			error: false,
			message: 'Estado de presupuestos obtenido correctamente',
			data: estado,
		});
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getAll,
	create,
	update,
	deletePresupuesto,
	getEstado,
};
