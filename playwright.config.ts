import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3210)
const baseURL = `http://127.0.0.1:${PORT}`
const preinstalled = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'
const executablePath = existsSync(preinstalled) && !process.env.CI ? preinstalled : undefined
const start = `node --env-file=.env.mock --env-file=.env.e2e .output/server/index.mjs`

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'off',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testIgnore: /smoke-http\.spec\.ts/ },
    { name: 'smoke-http', use: { ...devices['Desktop Chrome'] }, testMatch: /smoke-http\.spec\.ts/ },
  ],
  webServer: {
    command: process.env.E2E_SKIP_BUILD ? start : `pnpm build && ${start}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      PORT: String(PORT),
      HOST: '127.0.0.1',
      ...(process.env.E2E_REAL_HTTP
        ? { NUXT_API_MOCK: 'false', NUXT_MOCK_ROUTES: 'true', NUXT_API_BASE: `${baseURL}/api/mock` }
        : {}),
    },
  },
})
