/**
 * Controlador de gastos
 * Manejo de errores con try/catch
 */

const { supabase, isSupabaseConfigured } = require('../config/supabase');
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// Datos de ejemplo 
const gastos = [
  { id: 1, userId: DEMO_USER_ID, descripcion: 'Comida', monto: 50, categoria: 'Alimentación' },
  { id: 2, userId: DEMO_USER_ID, descripcion: 'Transporte', monto: 20, categoria: 'Transporte' }
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

/**
 * Obtener todos los gastos
 */
async function getAll(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true });

      if (error) {
        throw createSupabaseError(error, 'No se pudieron obtener los gastos');
      }

      return res.json({
        error: false,
        message: 'Gastos obtenidos correctamente',
        data: data || [],
      });
    }

    res.json({
      error: false,
      message: 'Gastos obtenidos correctamente',
      data: gastos.filter((gasto) => String(gasto.userId) === String(userId))
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener un gasto específico por ID
 */
async function getById(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const rawId = req.params.id;
    const id = toNumericIdIfPossible(rawId);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw createSupabaseError(error, 'No se pudo obtener el gasto');
      }

      if (!data) {
        return res.status(404).json({
          error: true,
          message: 'Gasto no encontrado',
          status: 404,
        });
      }

      return res.json({
        error: false,
        message: 'Gasto obtenido correctamente',
        data,
      });
    }

    const gasto = gastos.find(
      (item) => item.id === id && String(item.userId) === String(userId)
    );

    // Si no existe, responder 404
    if (!gasto) {
      return res.status(404).json({
        error: true,
        message: 'Gasto no encontrado',
        status: 404
      });
    }

    res.json({
      error: false,
      message: 'Gasto obtenido correctamente',
      data: gasto
    });
  } catch (err) {
    // Lanzar error para que lo capture el middleware
    next(err);
  }
}

/**
 * Crear nuevo gasto
 */
async function create(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { descripcion, monto, categoria } = req.body;

    // Validar datos
    if (!descripcion || !monto || !categoria) {
      return res.status(400).json({
        error: true,
        message: 'Datos incompletos. Se requieren descripción, monto y categoría.',
        status: 400
      });
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('gastos')
        .insert({ descripcion, monto, categoria, user_id: userId })
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        throw createSupabaseError(error, 'No se pudo crear el gasto', 400);
      }

      return res.status(201).json({
        error: false,
        message: 'Gasto creado correctamente',
        data,
      });
    }

    // Crear gasto (fallback en memoria)
    const nuevoGasto = {
      id: gastos.length + 1,
      userId,
      descripcion,
      monto,
      categoria
    };

    gastos.push(nuevoGasto);

    res.status(201).json({
      error: false,
      message: 'Gasto creado correctamente',
      data: nuevoGasto
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Actualizar gasto
 */
async function update(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const id = toNumericIdIfPossible(req.params.id);
    const { descripcion, monto, categoria } = req.body;

    if (isSupabaseConfigured) {
      const updates = {};
      if (typeof descripcion !== 'undefined') {
        updates.descripcion = descripcion;
      }
      if (typeof monto !== 'undefined') {
        updates.monto = monto;
      }
      if (typeof categoria !== 'undefined') {
        updates.categoria = categoria;
      }

      const { data, error } = await supabase
        .from('gastos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*');

      if (error) {
        throw createSupabaseError(error, 'No se pudo actualizar el gasto', 400);
      }

      const gastoActualizado = data?.[0];

      if (!gastoActualizado) {
        return res.status(404).json({
          error: true,
          message: 'Gasto no encontrado',
          status: 404
        });
      }

      return res.json({
        error: false,
        message: 'Gasto actualizado correctamente',
        data: gastoActualizado
      });
    }

    const gasto = gastos.find(
      (item) => item.id === id && String(item.userId) === String(userId)
    );

    if (!gasto) {
      return res.status(404).json({
        error: true,
        message: 'Gasto no encontrado',
        status: 404
      });
    }

    // Actualizar
    if (typeof descripcion !== 'undefined') {gasto.descripcion = descripcion;}
    if (typeof monto !== 'undefined') {gasto.monto = monto;}
    if (typeof categoria !== 'undefined') {gasto.categoria = categoria;}

    res.json({
      error: false,
      message: 'Gasto actualizado correctamente',
      data: gasto
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Eliminar gasto
 */
async function deleteGasto(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const id = toNumericIdIfPossible(req.params.id);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id');

      if (error) {
        throw createSupabaseError(error, 'No se pudo eliminar el gasto', 400);
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          error: true,
          message: 'Gasto no encontrado',
          status: 404
        });
      }

      return res.json({
        error: false,
        message: 'Gasto eliminado correctamente'
      });
    }

    const index = gastos.findIndex(
      (item) => item.id === id && String(item.userId) === String(userId)
    );

    if (index === -1) {
      return res.status(404).json({
        error: true,
        message: 'Gasto no encontrado',
        status: 404
      });
    }

    gastos.splice(index, 1);

    res.json({
      error: false,
      message: 'Gasto eliminado correctamente'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteGasto
};
