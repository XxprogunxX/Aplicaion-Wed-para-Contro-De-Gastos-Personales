/**
 * Validación de JWT en arranque y constante de secreto por defecto (solo desarrollo).
 */
const DEFAULT_DEV_SECRET = 'dev_jwt_secret_change_me';

function assertProductionJwtSecret() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret || secret === DEFAULT_DEV_SECRET) {
    throw new Error(
      'JWT_SECRET debe definirse con un valor aleatorio fuerte en producción (no uses el valor por defecto de desarrollo).'
    );
  }
}

function getJwtSecret() {
  return String(process.env.JWT_SECRET || '').trim() || DEFAULT_DEV_SECRET;
}

module.exports = {
  assertProductionJwtSecret,
  getJwtSecret,
  DEFAULT_DEV_SECRET,
};
