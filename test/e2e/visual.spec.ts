import { loginAndWait, test } from './fixtures'

const PAGES = ['/', '/users', '/settings/appearance', '/roles', '/does-not-exist']

for (const locale of ['en', 'ar'] as const) {
  for (const scheme of ['light', 'dark'] as const) {
    for (const width of [375, 1440]) {
      test(`visual ${locale} ${scheme} ${width}`, async ({ page, baseURL }) => {
        await page.context().addCookies([{ name: 'i18n_redirected', value: locale, url: baseURL! }])
        await page.emulateMedia({ colorScheme: scheme })
        await page.setViewportSize({ width, height: 900 })
        await page.goto('/login')
        await page.waitForTimeout(500)
        await page.screenshot({ path: `test/e2e/__screenshots__/${locale}-${scheme}-${width}-login.png`, fullPage: true })
        await loginAndWait(page, locale === 'ar' ? 'manager' : 'admin')
        for (const p of PAGES) {
          await page.goto(p)
          await page.waitForTimeout(1200)
          await page.screenshot({ path: `test/e2e/__screenshots__/${locale}-${scheme}-${width}${p.replace(/\//g, '_')}.png`, fullPage: true })
        }
      })
    }
  }
}
