/**
 * Validación de JWT en arranque y constante de secreto por defecto (solo desarrollo).
 */
const DEFAULT_DEV_SECRET = 'dev_jwt_secret_change_me';

function assertProductionJwtSecret(env = process.env) {
  if (env.NODE_ENV !== 'production') {
    return;
  }
  const secret = String(env.JWT_SECRET || '').trim();
  if (!secret || secret === DEFAULT_DEV_SECRET) {
    throw new Error(
      'JWT_SECRET debe definirse con un valor aleatorio fuerte en producción (no uses el valor por defecto de desarrollo).'
    );
  }
  if (secret.length < 32) {
    throw new Error(
      'JWT_SECRET debe tener mínimo 32 caracteres en producción (se recomienda 256 bits = 43 caracteres en base64).'
    );
  }
}

function getJwtSecret() {
  return String(process.env.JWT_SECRET || '').trim() || DEFAULT_DEV_SECRET;
}

// Validar JWT_SECRET en tiempo de carga del módulo
assertProductionJwtSecret();

module.exports = {
  assertProductionJwtSecret,
  getJwtSecret,
  DEFAULT_DEV_SECRET,
};
