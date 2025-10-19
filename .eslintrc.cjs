/**
 * ESLint config
 * - Extends TypeScript ESLint recommended rules
 * - Extends requiring-type-checking rules (type-aware)
 * - Disables rules conflicting with Prettier via `prettier`
 */
module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    browser: true,
    jest: true,
  },
  ignorePatterns: [
    '**/node_modules/',
    '**/dist/',
    'coverage/',
    '.specify/',
    'specs/**',
  ],
  overrides: [
    // TypeScript files
    {
      files: ['**/*.ts', '**/*.tsx'],
      excludedFiles: ['**/*.d.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [
          './tsconfig.eslint.json',
          './apps/**/tsconfig.json',
        ],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier',
      ],
      rules: {},
    },
    // JavaScript files
    {
      files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
      extends: ['eslint:recommended', 'prettier'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: {
        // Allow intentionally empty catch blocks common in PoC scripts
        'no-empty': ['error', { allowEmptyCatch: true }],
      },
    },
    // Test files (Jest)
    {
      files: ['tests/**/*.*'],
      env: { jest: true, node: true, browser: true },
      rules: {
        'no-unused-vars': 'off',
        'no-empty': ['error', { allowEmptyCatch: true }],
      },
    },
  ],
};
