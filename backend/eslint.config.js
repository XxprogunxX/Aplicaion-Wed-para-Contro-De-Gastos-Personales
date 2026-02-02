/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      'node_modules',
      'dist',
      'build'
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        process: 'readonly'
      }
    },
    rules: {
      // Buenas prácticas generales
      eqeqeq: ['error', 'smart'],
      curly: 'error',
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      // En backend permitir logs
      'no-console': 'off'
    }
  }
];
