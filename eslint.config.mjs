// @ts-check
import betterTailwind from 'eslint-plugin-better-tailwindcss'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['templates/**', 'scripts/__fixtures__/**', 'test-results/**', 'playwright-report/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true }],
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    files: ['**/*.vue', 'app/**/*.ts', 'layers/**/app/**/*.ts'],
    ...betterTailwind.configs['correctness-error'],
    settings: {
      'better-tailwindcss': { entryPoint: 'app/assets/css/main.css' },
    },
    rules: {
      ...betterTailwind.configs['correctness-error'].rules,
      // Nuxt UI semantic utilities (text-highlighted, bg-elevated, …) come from a build-time
      // stylesheet (#build/ui.css) the plugin cannot resolve, so unknown-class detection is off.
      'better-tailwindcss/no-unknown-classes': 'off',
    },
  },
  {
    // Server code imports helpers explicitly from `nuxt/server`; h3 is banned.
    files: ['layers/*/server/**/*.ts', 'mock-api/server/**/*.ts', 'server/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'h3', message: 'Import server helpers from `nuxt/server` instead.' }],
      }],
    },
  },
)
