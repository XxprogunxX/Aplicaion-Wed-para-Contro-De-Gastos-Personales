const jwt = require('jsonwebtoken');

const DEFAULT_TEST_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@gastos.app',
  username: 'Usuario Demo',
  role: 'user',
};

function createTestToken(overrides = {}) {
  const user = {
    ...DEFAULT_TEST_USER,
    ...overrides,
  };

  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

  return jwt.sign(
    {
      sub: String(user.id),
      id: String(user.id),
      email: user.email,
      username: user.username,
      role: user.role,
    },
    secret,
    { expiresIn: '1h' }
  );
}

function buildAuthHeader(overrides = {}) {
  return `Bearer ${createTestToken(overrides)}`;
}

module.exports = {
  createTestToken,
  buildAuthHeader,
  DEFAULT_TEST_USER,
};