import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  test: {
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      include: ['layers/core/app/utils/**', 'layers/core/app/composables/**'],
      thresholds: {
        'layers/core/app/utils/**': { lines: 80 },
      },
    },
    projects: [
      {
        resolve: {
          alias: {
            '#layers/core': r('./layers/core'),
            '#layers/users': r('./layers/users'),
            '#layers/roles': r('./layers/roles'),
            '#layers/dashboard': r('./layers/dashboard'),
            '#layers/auth': r('./layers/auth'),
            '#layers/profile': r('./layers/profile'),
            '#layers/settings': r('./layers/settings'),
          },
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['layers/**/test/**/*.test.ts', 'scripts/**/*.test.ts', 'mock-api/**/*.test.ts'],
          exclude: ['**/*.nuxt.test.ts', '**/node_modules/**'],
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['layers/**/test/**/*.nuxt.test.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: { domEnvironment: 'happy-dom' },
          },
        },
      }),
    ],
  },
})
