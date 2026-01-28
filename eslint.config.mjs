// @ts-check
import eslint from '@eslint/js';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

export default [
  // Global ignores (applies to all configs)
  {
    ignores: [
      'benchmark/**',
      '__test__/mock/*',
      '__test__/**/helper/*',
      'node_modules/**',
      'coverage/**',
      'dist/**',
      '**/*.js',
      '**/*.d.ts',
      '**/*.js.map',
      '**/*.d.ts.map',
      '!eslint.config.js',
      '!jest.config.js',
      '!gulpfile.js',
    ],
  },
  
  // Base ESLint recommended rules
  eslint.configs.recommended,
  
  // Main configuration for TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.linter.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      jsdoc,
    },
    rules: {
      // Apply TypeScript recommended rules
      ...tseslintPlugin.configs.recommended.rules,
      
      // Disable semicolon requirements
      'semi': 'off',
      '@typescript-eslint/semi': 'off',
      
      // Array type preferences
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      
      // Return await handling
      '@typescript-eslint/return-await': 'off',
      
      // Boolean expression strictness
      '@typescript-eslint/strict-boolean-expressions': 'off',
      
      // Function return type requirements
      '@typescript-eslint/explicit-function-return-type': 'off',
      
      // Allow classes with only static members
      '@typescript-eslint/no-extraneous-class': 'off',
      
      // Unsafe argument warnings
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      
      // Unused variables with ignore patterns
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      
      // Allow explicit any where needed (warn instead of error)
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Allow non-null assertions (used in tests)
      '@typescript-eslint/no-non-null-assertion': 'off',
      
      // Allow require imports (used in some configs)
      '@typescript-eslint/no-require-imports': 'off',
      
      // General rules
      'no-duplicate-imports': 'off',
      'no-unused-vars': 'off', // Use TypeScript version instead
    },
  },
  
  // Configuration for test files
  {
    files: ['__test__/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  
  // Configuration for JavaScript config files
  {
    files: ['*.js', '*.mjs', '*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];

