// TODO: Implementar modelos de Mongoose

// Modelo de Usuario
// - username: String
// - email: String (único)
// - password: String (hasheado)
// - createdAt, updatedAt: Date

// Modelo de Gasto
// - userId: ObjectId (referencia a Usuario)
// - descripcion: String
// - monto: Number
// - categoria: String
// - fecha: Date
// - createdAt, updatedAt: Date

// Modelo de Categoría
// - nombre: String
// - color: String
// - icono: String
// - userId: ObjectId (opcional)
// - esGlobal: Boolean

// Modelo de Presupuesto
// - userId: ObjectId
// - categoria: String
// - monto: Number
// - periodo: String ('mensual', 'anual')
// - mes: Number
// - anio: Number
// - createdAt, updatedAt: Date
