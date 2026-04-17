import path from 'node:path';
import { fileURLToPath } from 'node:url';

import eslintNestJs from '@darraghor/eslint-plugin-nestjs-typed';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));
const tsFiles = ['**/*.{ts,mts,cts}'];
const strictTypedConfigs = tseslint.configs.strictTypeChecked.map((config) => ({
  ...config,
  files: tsFiles,
}));
const nestRecommendedConfigs = eslintNestJs.configs.flatRecommended.map((config) => ({
  ...config,
  files: tsFiles,
}));

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.git/**', '**/.husky/_/**'],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  ...strictTypedConfigs,
  {
    files: tsFiles,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
    },
  },
  ...nestRecommendedConfigs,
  {
    files: ['**/*.spec.{ts,mts,cts}', '**/*.test.{ts,mts,cts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  eslintConfigPrettier,
);
