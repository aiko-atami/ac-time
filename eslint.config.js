import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  ignores: ['.agent/**'],
}, {
  rules: {
    // Shadcn UI components often export variants/constants
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // Console logs are useful in development, warn instead of error
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
})
