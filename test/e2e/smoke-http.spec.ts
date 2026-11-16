import { expect, loginAndWait, test } from './fixtures'

// Run with E2E_REAL_HTTP=1: the BFF talks to the mock over real HTTP (NUXT_API_MOCK=false).
test.describe('real-HTTP smoke', () => {
  test.skip(!process.env.E2E_REAL_HTTP, 'set E2E_REAL_HTTP=1')

  test('login, users list, 422 and refresh over HTTP', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.goto('/users')
    await expect(page.getByTestId('users-table')).toContainText('@')
    await page.goto('/dev/errors')
    await page.getByTestId('simulate-422').click()
    await expect(page.getByText('The email has already been taken.')).toBeVisible()
    await page.waitForTimeout(6000)
    await page.goto('/users')
    await expect(page.getByTestId('users-table')).toContainText('@')
  })
})
