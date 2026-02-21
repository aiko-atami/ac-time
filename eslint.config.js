// Flat ESLint config for React + TypeScript on ESLint v10 without preset wrappers.
import js from '@eslint/js'
import eslintReact from '@eslint-react/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['.agents/**', 'dist/**', '.wrangler/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintReact.configs['recommended-typescript'],
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      // Keep migration practical: avoid blocking lint on legacy harmless patterns.
      'no-empty': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Shadcn UI components often export variants/constants.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Console logs are useful in development, warn instead of error.
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
)
