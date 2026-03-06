/**
 * Servidor Express
 */
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

// Middlewares
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const authMiddleware = require('./middleware/auth');
const { isSupabaseConfigured, supabaseKeyMode } = require('./config/supabase');

// Rutas
const gastosRoutes = require('./routes/routes');
const authRoutes = require('./routes/authRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const presupuestosRoutes = require('./routes/presupuestosRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const chatRoutes = require('./routes/chatRoutes');

const PORT = process.env.PORT || 3000;

// Configuración
app.use(
  cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor ejecutándose' });
});

// Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
app.use('/api/gastos', authMiddleware, gastosRoutes);
app.use('/api/categorias', authMiddleware, categoriasRoutes);
app.use('/api/presupuestos', authMiddleware, presupuestosRoutes);
app.use('/api/reportes', authMiddleware, reportesRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);

// Manejadores finales
app.use(notFoundHandler);
app.use(errorHandler);

// Iniciar servidor solo cuando se ejecuta este archivo directamente
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Servidor ejecutándose en puerto ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ Database mode: ${isSupabaseConfigured ? 'supabase' : 'in-memory fallback'}`);
    if (isSupabaseConfigured) {
      console.log(`✓ Supabase key mode: ${supabaseKeyMode}`);
    }
  });
}

module.exports = app;
