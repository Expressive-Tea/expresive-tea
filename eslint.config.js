// @ts-check
// ESLint v9 Flat Config

/* eslint-env node */
/* global require, module */

const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const jsdocPlugin = require('eslint-plugin-jsdoc');
const preferArrowPlugin = require('eslint-plugin-prefer-arrow');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // Ignore patterns
  {
    ignores: [
      'benchmark/**/*.ts',
      '__test__/mock/*',
      '__test__/**/helper/*',
      'node_modules/**',
      'lib/**',
      'dist/**',
      '**/*.js',
      '!eslint.config.js',
      '**/*.d.ts',
      'tools/**',
      'test-*.ts',
      'test-*.js'
    ]
  },

  // Base JavaScript recommended
  js.configs.recommended,

  // TypeScript files configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.linter.json',
        sourceType: 'module',
        ecmaVersion: 2020
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'jsdoc': jsdocPlugin,
      'prefer-arrow': preferArrowPlugin
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      ...tsPlugin.configs['recommended-requiring-type-checking'].rules,

      // Customize rules from original .eslintrc.js
      'semi': 'off',
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      '@typescript-eslint/return-await': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/explicit-function-return-type': ['off', { allowExpressions: true }],
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'no-duplicate-imports': 'off',

      // Additional type-safety rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      'no-empty': 'error',
      'no-undef': 'error'
    }
  },

  // Test files - relaxed rules
  {
    files: ['__test__/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
    languageOptions: {
      globals: {
        // Jest globals
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        // Node globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': 'off',
      'no-undef': 'off'
    }
  },

  // Apply Prettier config last to override conflicting rules
  prettierConfig
];
