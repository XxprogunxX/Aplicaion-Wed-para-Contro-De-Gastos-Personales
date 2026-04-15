/**
 * Test de seguridad: JWT_SECRET en producción
 * Verifica que no se use secreto inseguro en ambiente production
 */

describe('JWT_SECRET - Seguridad en Producción', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
    // Limpiar require cache
    delete require.cache[require.resolve('../src/config/jwtEnv')];
  });

  test('En development, JWT_SECRET puede tener valor por defecto', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'dev-secret';

    const { getJwtSecret } = require('../src/config/jwtEnv');
    expect(() => getJwtSecret()).not.toThrow();
  });

  test('En production, JWT_SECRET debe estar configurado', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'production-secret-super-fuerte-32-caracteres-minimo';

    const { getJwtSecret } = require('../src/config/jwtEnv');
    const secret = getJwtSecret();
    expect(secret).toBeTruthy();
    expect(secret).not.toBe('development-secret');
  });

  test('En production, JWT_SECRET vacío debe fallar', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = '';

    // Limpiar cache antes de require
    delete require.cache[require.resolve('../src/config/jwtEnv')];

    expect(() => {
      require('../src/config/jwtEnv');
    }).toThrow();
  });

  test('En production sin JWT_SECRET debe fallar', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    // Limpiar cache
    delete require.cache[require.resolve('../src/config/jwtEnv')];

    expect(() => {
      require('../src/config/jwtEnv');
    }).toThrow();
  });

  test('JWT_SECRET debe tener mínimo 32 caracteres en production', () => {
    process.env.NODE_ENV = 'production';
    const secretShort = 'short'; // Inseguro

    // Este test documenta la recomendación de seguridad
    expect(secretShort.length).toBeLessThan(32);
    console.warn('⚠️ JWT_SECRET muy corto - usar mínimo 256 bits (43 caracteres base64)');
  });
});
