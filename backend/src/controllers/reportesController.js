const { supabase, isSupabaseConfigured } = require('../config/supabase');
const { normalizeCategory } = require('../utils/categoryNormalizer');
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

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
		descripcion: 'Transporte publico',
		monto: 20,
		categoria: 'Transporte',
		fecha: new Date().toISOString(),
	},
	{
		id: 3,
		userId: DEMO_USER_ID,
		descripcion: 'Internet',
		monto: 35,
		categoria: 'Servicios',
		fecha: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
	},
];

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

function resolveDate(gasto) {
	const rawValue = gasto?.fecha || gasto?.created_at;
	if (!rawValue) {
		return null;
	}

	const rawDate = String(rawValue).trim();
	const dateOnlyMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (dateOnlyMatch) {
		const year = Number(dateOnlyMatch[1]);
		const month = Number(dateOnlyMatch[2]);
		const day = Number(dateOnlyMatch[3]);

		const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);
		if (
			localDate.getFullYear() === year
			&& localDate.getMonth() === month - 1
			&& localDate.getDate() === day
		) {
			return localDate;
		}
	}

	const date = new Date(rawDate);
	return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeCategoria(value, contextText = '') {
	return normalizeCategory(value, contextText);
}

function normalizeGastoRecord(gasto) {
	if (!gasto || typeof gasto !== 'object') {
		return gasto;
	}

	return {
		...gasto,
		categoria: normalizeCategoria(gasto.categoria, gasto.descripcion || ''),
	};
}

function aggregateByCategoria(gastos) {
	return gastos.reduce((acc, gasto) => {
		const categoria = normalizeCategoria(gasto.categoria, gasto.descripcion || '');
		acc[categoria] = (acc[categoria] || 0) + toNumber(gasto.monto);
		return acc;
	}, {});
}

function aggregateByMes(gastos) {
	const gastosPorMes = {
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		5: 0,
		6: 0,
		7: 0,
		8: 0,
		9: 0,
		10: 0,
		11: 0,
		12: 0,
	};

	for (const gasto of gastos) {
		const date = resolveDate(gasto);
		if (!date) {
			continue;
		}

		const month = date.getMonth() + 1;
		gastosPorMes[month] += toNumber(gasto.monto);
	}

	return gastosPorMes;
}

async function getGastosData(userId) {
	if (!isSupabaseConfigured) {
		return gastosFallback.filter((item) => String(item.userId) === String(userId));
	}

	const { data, error } = await supabase
		.from('gastos')
		.select('id,descripcion,monto,categoria,fecha,created_at')
		.eq('user_id', userId)
		.order('id', { ascending: true });

	if (error) {
		throw createSupabaseError(error, 'No se pudieron obtener los gastos para reportes');
	}

	return data || [];
}

function filterByMonthAndYear(gastos, mes, anio) {
	return gastos.filter((gasto) => {
		const date = resolveDate(gasto);
		if (!date) {
			return false;
		}

		return date.getMonth() + 1 === mes && date.getFullYear() === anio;
	});
}

function filterByYear(gastos, anio) {
	return gastos.filter((gasto) => {
		const date = resolveDate(gasto);
		if (!date) {
			return false;
		}

		return date.getFullYear() === anio;
	});
}

function summarize(gastos) {
	return gastos.reduce((total, gasto) => total + toNumber(gasto.monto), 0);
}

async function getMensual(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);
		const now = new Date();
		const mes = Number(req.query.mes || now.getMonth() + 1);
		const anio = Number(req.query.anio || now.getFullYear());

		if (!Number.isFinite(mes) || mes < 1 || mes > 12 || !Number.isFinite(anio) || anio < 1) {
			return res.status(400).json({
				error: true,
				message: 'Parametros invalidos. mes (1-12) y anio son requeridos.',
				status: 400,
			});
		}

		const gastosData = await getGastosData(userId);
		const gastosMensuales = filterByMonthAndYear(gastosData, mes, anio);
		const totalGastado = summarize(gastosMensuales);
		const gastosPorCategoria = aggregateByCategoria(gastosMensuales);

		res.json({
			error: false,
			message: 'Reporte mensual generado correctamente',
			data: {
				mes,
				anio,
				totalGastado,
				cantidadGastos: gastosMensuales.length,
				gastosPorCategoria,
				gastos: gastosMensuales.map((item) => normalizeGastoRecord(item)),
			},
		});
	} catch (err) {
		next(err);
	}
}

async function getAnual(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);
		const anio = Number(req.query.anio || new Date().getFullYear());

		if (!Number.isFinite(anio) || anio < 1) {
			return res.status(400).json({
				error: true,
				message: 'Parametro invalido. anio es requerido.',
				status: 400,
			});
		}

		const gastosData = await getGastosData(userId);
		const gastosAnuales = filterByYear(gastosData, anio);
		const totalGastado = summarize(gastosAnuales);
		const gastosPorCategoria = aggregateByCategoria(gastosAnuales);
		const gastosPorMes = aggregateByMes(gastosAnuales);

		res.json({
			error: false,
			message: 'Reporte anual generado correctamente',
			data: {
				anio,
				totalGastado,
				cantidadGastos: gastosAnuales.length,
				gastosPorCategoria,
				gastosPorMes,
			},
		});
	} catch (err) {
		next(err);
	}
}

async function getPorCategoria(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);
		const gastosData = await getGastosData(userId);
		const totalGeneral = summarize(gastosData);
		const grouped = aggregateByCategoria(gastosData);

		const data = Object.entries(grouped)
			.map(([categoria, total]) => {
				const cantidad = gastosData.filter(
					(gasto) => normalizeCategoria(gasto.categoria, gasto.descripcion || '') === categoria
				).length;

				return {
					categoria,
					total,
					cantidad,
					porcentaje: totalGeneral > 0 ? Number(((total / totalGeneral) * 100).toFixed(2)) : 0,
				};
			})
			.sort((a, b) => b.total - a.total);

		res.json({
			error: false,
			message: 'Reporte por categoria generado correctamente',
			data: {
				totalGeneral,
				categorias: data,
			},
		});
	} catch (err) {
		next(err);
	}
}

async function getComparativo(req, res, next) {
	try {
		const userId = getAuthenticatedUserId(req);
		const now = new Date();

		const mesActual = Number(req.query.mesActual || now.getMonth() + 1);
		const anioActual = Number(req.query.anioActual || now.getFullYear());

		const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const mesComparar = Number(req.query.mesComparar || previous.getMonth() + 1);
		const anioComparar = Number(req.query.anioComparar || previous.getFullYear());

		const gastosData = await getGastosData(userId);

		const gastosActuales = filterByMonthAndYear(gastosData, mesActual, anioActual);
		const gastosComparar = filterByMonthAndYear(gastosData, mesComparar, anioComparar);

		const totalActual = summarize(gastosActuales);
		const totalComparar = summarize(gastosComparar);

		const variacion = totalActual - totalComparar;
		const variacionPorcentual = totalComparar > 0
			? Number(((variacion / totalComparar) * 100).toFixed(2))
			: null;

		res.json({
			error: false,
			message: 'Reporte comparativo generado correctamente',
			data: {
				periodoActual: {
					mes: mesActual,
					anio: anioActual,
					total: totalActual,
				},
				periodoComparado: {
					mes: mesComparar,
					anio: anioComparar,
					total: totalComparar,
				},
				variacion,
				variacionPorcentual,
			},
		});
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getMensual,
	getAnual,
	getPorCategoria,
	getComparativo,
};
