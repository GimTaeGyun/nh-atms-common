import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'dist-mock', 'coverage', 'playwright-report', 'test-results', 'public/mockServiceWorker.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, __APP_VERSION__: 'readonly', __BUILD_TIME__: 'readonly' },
    },
    rules: {
      // 운영 코드 품질 규칙 (마스터플랜 §5.2: any 금지, catch unknown)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // 화면별 로컬 포맷 함수 재정의 금지 — utils/format 사용 (17 학습가이드 1-5)
      'no-restricted-syntax': [
        'error',
        {
          selector: "VariableDeclarator[id.name=/^(fmtDate|fmtDateTime|fmtAmount|fmtTermId|formatDate|formatAmount)$/]",
          message: '포맷 함수는 @/utils/format 에서 import 하세요 (로컬 재정의 금지).',
        },
      ],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/mocks/**/*.ts', 'src/test/**/*.{ts,tsx}', 'e2e/**/*.ts', '**/*.test.{ts,tsx}', 'src/components/**/*.tsx', 'src/screens/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['src/utils/format.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
]);
