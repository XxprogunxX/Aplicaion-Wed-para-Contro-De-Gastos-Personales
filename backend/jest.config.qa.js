/**
 * Suite QA: integración real (sin mocks de controladores).
 * Ejecutar: npm run test:qa
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/qa/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/qa/jest.qa.setup.js'],
  testTimeout: 45000,
  maxWorkers: 1,
  forceExit: true,
};
