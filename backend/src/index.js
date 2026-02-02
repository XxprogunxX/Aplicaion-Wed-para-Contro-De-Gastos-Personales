/**
 * Servidor Express
 */
const express = require('express')
const app = express()

// Middlewares
const errorHandler = require('./middleware/errorHandler')
const notFoundHandler = require('./middleware/notFoundHandler')
const authMiddleware = require('./middleware/auth')

// Rutas
const gastosRoutes = require('./routes/routes')

const PORT = process.env.PORT || 3001

// Configuración
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor ejecutándose' })
})

// Rutas públicas
// TODO: Agregar rutas de auth aquí

// Rutas protegidas (requieren autenticación)
app.use('/api/gastos', authMiddleware, gastosRoutes)

// Manejadores finales
app.use(notFoundHandler)
app.use(errorHandler)

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✓ Servidor ejecutándose en puerto ${PORT}`)
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app
