import { test as base, expect, type Page } from '@playwright/test'

export type DemoAccount = 'admin' | 'manager' | 'viewer' | 'noaccess'

/** Browser noise that is expected (failed requests are asserted on explicitly). */
const IGNORED = [
  /Failed to load resource/,
  /net::ERR_/,
  /baseUrl/,
  // Nuxt's own diagnostic when a page load starts with a fatal error (403/404 views).
  /NUXT_E1005/,
]

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Playwright's idiom for auto fixtures without a value
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page, request }, use) => {
    await request.post('/api/mock/__reset')
    const problems: string[] = []
    page.on('pageerror', e => problems.push(`pageerror: ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error' && !IGNORED.some(r => r.test(m.text()))) problems.push(`console.error: ${m.text()}`)
    })
    await use()
    expect(problems, problems.join('\n')).toEqual([])
  }, { auto: true }],
})

export { expect }

export async function login(page: Page, account: DemoAccount, options: { redirect?: string } = {}) {
  await page.goto(options.redirect ? `/login?redirect=${encodeURIComponent(options.redirect)}` : '/login')
  await page.locator('input[type=email]').fill(`${account}@demo.test`)
  await page.locator('input[autocomplete=current-password]').fill('Password123!')
  await page.locator('form button[type=submit]').click()
}

export async function loginAndWait(page: Page, account: DemoAccount, path = '/') {
  await login(page, account)
  await page.waitForURL(url => url.pathname === (account === 'noaccess' ? '/no-access' : path))
}

/** Number of visible toasts with an error color. */
export function errorToasts(page: Page) {
  return page.locator('[data-slot="root"][data-state="open"]').filter({ has: page.locator('.text-error, [class*="text-error"]') })
}

/** A toast (or any notification) title with exactly this text. */
export function toast(page: Page, text: string | RegExp) {
  return page.locator('[data-slot="title"]').filter({ hasText: text }).first()
}
