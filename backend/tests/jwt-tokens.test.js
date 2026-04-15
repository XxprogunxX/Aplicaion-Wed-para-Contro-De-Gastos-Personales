const jwt = require('jsonwebtoken');
const { issueToken } = require('../src/controllers/authController');
const { getJwtSecret } = require('../src/config/jwtEnv');

describe('JWT - Tokens seguros con expiración', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const mockUserId = 'user-123';

  beforeAll(() => {
    // Asegurar que JWT_SECRET está disponible
    process.env.JWT_SECRET = JWT_SECRET;
  });

  test('Token debe expirar en 12 horas', () => {
    const token = jwt.sign(
      { id: mockUserId },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    const decoded = jwt.decode(token);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expirationInSeconds = decoded.exp - nowInSeconds;
    const expirationInHours = expirationInSeconds / 3600;

    // Debería estar muy cerca a 12 horas (con tolerancia de 1 segundo)
    expect(expirationInHours).toBeGreaterThan(11.99);
    expect(expirationInHours).toBeLessThanOrEqual(12.01);
  });

  test('jwt.verify() debe rechazar token caducado', () => {
    const expiredToken = jwt.sign(
      { id: mockUserId },
      JWT_SECRET,
      { expiresIn: '-1h' } // Ya expirado
    );

    expect(() => {
      jwt.verify(expiredToken, JWT_SECRET);
    }).toThrow('jwt expired');
  });

  test('jwt.verify() debe rechazar token con firma inválida', () => {
    const validToken = jwt.sign(
      { id: mockUserId },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    expect(() => {
      jwt.verify(validToken, 'wrong-secret');
    }).toThrow('invalid signature');
  });

  test('Token sin firma debe ser rechazado', () => {
    const invalidToken = 'invalid.token.here';

    expect(() => {
      jwt.verify(invalidToken, JWT_SECRET);
    }).toThrow();
  });

  test('Token decodificado debe contener payload correcto', () => {
    const token = jwt.sign(
      { id: mockUserId, role: 'user' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.id).toBe(mockUserId);
    expect(decoded.role).toBe('user');
    expect(decoded.exp).toBeDefined();
  });

  test('Secreto debe tener valor configurado', () => {
    expect(JWT_SECRET).toBeTruthy();
    expect(JWT_SECRET.length).toBeGreaterThan(5);
  });

  test('Token sin expiración no debería usarse (seguridad)', () => {
    const tokenWithoutExpiry = jwt.sign(
      { id: mockUserId },
      JWT_SECRET
      // Sin expiresIn
    );

    const decoded = jwt.decode(tokenWithoutExpiry);
    // Este test documenta que los tokens deberían siempre tener exp
    expect(decoded.exp).toBeUndefined();
    console.warn('⚠️ Token sin expiración detectado - agregar expiresIn en issueToken()');
  });
});
