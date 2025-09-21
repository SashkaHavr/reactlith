import * as path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import pluginRouter from '@tanstack/eslint-plugin-router';
import pluginReactCompiler from 'eslint-plugin-react-compiler';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  includeIgnoreFile(path.join(import.meta.dirname, '../../.gitignore')),
  { ignores: ['**/*.config.*', '**/*.js'] },
  {
    extends: [js.configs.recommended],
    rules: {
      curly: ['error', 'multi-line'],
      'no-empty': ['error', { allowEmptyCatch: true }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    extends: [
      tseslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylistic,
      tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  pluginReactHooks.configs['recommended-latest'],
  {
    ignores: ['src/components/ui/*.tsx'],
    extends: [pluginReactRefresh.configs.vite],
  },
  pluginReactCompiler.configs.recommended,
  pluginQuery.configs['flat/recommended'],
  pluginRouter.configs['flat/recommended'],
  {
    ignores: ['*.config.ts', '*.config.js', 'src/index.ts'],
    rules: {
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
    },
  },
  {
    rules: {
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Program > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression',
          message: 'Top-level arrow functions are not allowed.',
        },
        {
          selector:
            'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression',
          message: 'Top-level arrow functions are not allowed.',
        },
        {
          selector: 'ExportDefaultDeclaration > ArrowFunctionExpression',
          message: 'Top-level arrow functions are not allowed.',
        },
      ],
    },
  },
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: "Don't declare enums",
        },
      ],
    },
  },
  {
    ignores: ['src/components/ui/*.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: ['@radix-ui/*', '!@radix-ui/react-visually-hidden'] },
      ],
    },
  },
  {
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: { parserOptions: { projectService: true } },
  },
);
