import { existsSync } from 'node:fs'

/**
 * Chromium executable override. CI installs Playwright's own browser
 * (`pnpm exec playwright install chromium`); sandboxes with a preinstalled
 * browser can point `PLAYWRIGHT_CHROMIUM_PATH` (or /opt/pw-browsers/chromium) at it.
 */
export function chromiumPath() {
  const fromEnv = process.env.PLAYWRIGHT_CHROMIUM_PATH
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  const preinstalled = '/opt/pw-browsers/chromium'
  if (existsSync(preinstalled)) return preinstalled
  return undefined
}
