// TODO: Implementar servidor Express
const errorHandler = require('./middleware/errorHandler')
const express = require('express');
const mongoose = require('');
const app = express();

const _PORT = process.env.PORT || 3000;
app.use(errorHandler)
// server.listen(PORT, () => {
//   console.log(`Servidor ejecutándose en el puerto ${PORT}`);
// });
// - Configurar Express
// - Conectar a MongoDB
// - Configurar middlewares (CORS, body-parser)
// - Importar y usar las rutas
// - Manejo de errores