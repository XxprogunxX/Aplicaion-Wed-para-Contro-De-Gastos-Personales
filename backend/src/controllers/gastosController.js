/**
 * Controlador de gastos
 * Manejo de errores con try/catch
 */

// Datos de ejemplo 
const gastos = [
  { id: 1, descripcion: "Comida", monto: 50, categoria: "Alimentación" },
  { id: 2, descripcion: "Transporte", monto: 20, categoria: "Transporte" }
]

/**
 * Obtener todos los gastos
 */
async function getAll(req, res, next) {
  try {
    res.json({
      error: false,
      message: "Gastos obtenidos correctamente",
      data: gastos
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Obtener un gasto específico por ID
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params
    const gasto = gastos.find(g => g.id == id)

    // Si no existe, responder 404
    if (!gasto) {
      return res.status(404).json({
        error: true,
        message: "Gasto no encontrado",
        status: 404
      })
    }

    res.json({
      error: false,
      message: "Gasto obtenido correctamente",
      data: gasto
    })
  } catch (err) {
    // Lanzar error para que lo capture el middleware
    next(err)
  }
}

/**
 * Crear nuevo gasto
 */
async function create(req, res, next) {
  try {
    const { descripcion, monto, categoria } = req.body

    // Validar datos
    if (!descripcion || !monto || !categoria) {
      return res.status(400).json({
        error: true,
        message: "Error",
        status: 400
      })
    }

    // Crear gasto
    const nuevoGasto = {
      id: gastos.length + 1,
      descripcion,
      monto,
      categoria
    }

    gastos.push(nuevoGasto)

    res.status(201).json({
      error: false,
      message: "Exito",
      data: nuevoGasto
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Actualizar gasto
 */
async function update(req, res, next) {
  try {
    const { id } = req.params
    const { descripcion, monto, categoria } = req.body

    const gasto = gastos.find(g => g.id == id)

    if (!gasto) {
      return res.status(404).json({
        error: true,
        message: "Gasto no encontrado",
        status: 404
      })
    }

    // Actualizar
    if (descripcion) gasto.descripcion = descripcion
    if (monto) gasto.monto = monto
    if (categoria) gasto.categoria = categoria

    res.json({
      error: false,
      message: "Gasto actualizado correctamente",
      data: gasto
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Eliminar gasto
 */
async function deleteGasto(req, res, next) {
  try {
    const { id } = req.params

    const index = gastos.findIndex(g => g.id == id)

    if (index === -1) {
      return res.status(404).json({
        error: true,
        message: "Gasto no encontrado",
        status: 404
      })
    }

    gastos.splice(index, 1)

    res.json({
      error: false,
      message: "Gasto eliminado correctamente"
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteGasto
}
