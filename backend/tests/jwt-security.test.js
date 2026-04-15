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
  });

  test('En development, JWT_SECRET puede tener valor por defecto', () => {
    const { getJwtSecret } = require('../src/config/jwtEnv');
    expect(() => getJwtSecret()).not.toThrow();
  });

  test('En production, JWT_SECRET debe estar configurado', () => {
    const { assertProductionJwtSecret, getJwtSecret } = require('../src/config/jwtEnv');
    const testEnv = {
      NODE_ENV: 'production',
      JWT_SECRET: 'production-secret-super-fuerte-32-caracteres-minimo',
    };
    
    expect(() => assertProductionJwtSecret(testEnv)).not.toThrow();
  });

  test('En production, JWT_SECRET vacío debe fallar', () => {
    const { assertProductionJwtSecret } = require('../src/config/jwtEnv');
    const testEnv = {
      NODE_ENV: 'production',
      JWT_SECRET: '',
    };

    expect(() => {
      assertProductionJwtSecret(testEnv);
    }).toThrow();
  });

  test('En production sin JWT_SECRET debe fallar', () => {
    const { assertProductionJwtSecret } = require('../src/config/jwtEnv');
    const testEnv = {
      NODE_ENV: 'production',
      // JWT_SECRET no está definido (undefined)
    };

    expect(() => {
      assertProductionJwtSecret(testEnv);
    }).toThrow();
  });

  test('JWT_SECRET debe tener mínimo 32 caracteres en production', () => {
    const { assertProductionJwtSecret } = require('../src/config/jwtEnv');
    const secretShort = 'short'; // Inseguro
    const testEnv = {
      NODE_ENV: 'production',
      JWT_SECRET: secretShort,
    };

    // Este test documenta la recomendación de seguridad
    expect(secretShort.length).toBeLessThan(32);
    console.warn('⚠️ JWT_SECRET muy corto - usar mínimo 256 bits (43 caracteres base64)');
    
    // Secreto corto debería fallar en producción
    expect(() => assertProductionJwtSecret(testEnv)).toThrow();
  });
});
