import { expect, loginAndWait, test } from './fixtures'

test.describe('theme & rtl', () => {
  test('arabic sets dir=rtl before mount and puts the sidebar on the right', async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        (window as unknown as { __dirAtDcl: string }).__dirAtDcl = document.documentElement.dir
      })
    })
    await loginAndWait(page, 'manager')
    // the manager's preferred language is Arabic
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    expect(await page.evaluate(() => (window as unknown as { __dirAtDcl: string }).__dirAtDcl)).toBe('rtl')
    const box = await page.locator('aside [data-slot="container"]').boundingBox()
    expect(box!.x).toBeGreaterThan(1000)
  })

  test('primary color, dark mode and sidebar style survive a reload', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.goto('/settings/appearance')
    await page.getByRole('radio', { name: 'Rose' }).first().click()
    await page.getByRole('radio', { name: 'Dark' }).first().click()
    await page.getByRole('radio', { name: 'Floating' }).first().click()
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('radio', { name: 'Rose' }).first()).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('aside[data-variant="floating"]')).toHaveCount(1)
    const [primary, rose] = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement)
      return [s.getPropertyValue('--ui-primary').trim(), s.getPropertyValue('--color-rose-400').trim()]
    })
    expect(primary).toBe(rose)
  })

  test('a reload at mobile width does not change the persisted desktop sidebar state', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await page.waitForTimeout(500)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.reload()
    await expect(page.locator('aside[data-state="expanded"]')).toHaveCount(1)
  })
})
