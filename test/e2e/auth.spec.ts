import { expect, login, loginAndWait, test } from './fixtures'

test.describe('auth', () => {
  test('login success lands on the dashboard', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sara')
  })

  test('wrong password shows an inline alert, no redirect', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type=email]').fill('admin@demo.test')
    await page.locator('input[autocomplete=current-password]').fill('wrong-password')
    await page.locator('form button[type=submit]').click()
    await expect(page.getByTestId('login-error')).toContainText('incorrect')
    await expect(page).toHaveURL(/\/login/)
  })

  test('client validation shows field errors', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type=email]').fill('not-an-email')
    await page.locator('form button[type=submit]').click()
    await expect(page.getByText('Enter a valid email address')).toBeVisible()
  })

  test('protected page redirects to login and back after sign-in', async ({ page }) => {
    await page.goto('/users?search=ali')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await page.locator('input[type=email]').fill('admin@demo.test')
    await page.locator('input[autocomplete=current-password]').fill('Password123!')
    await page.locator('form button[type=submit]').click()
    await page.waitForURL(/\/users\?search=ali/)
  })

  test('open redirects are ignored', async ({ page }) => {
    await login(page, 'admin', { redirect: '//evil.example' })
    await page.waitForURL(url => url.pathname === '/')
  })

  test('logged-in users are sent away from guest pages', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.goto('/login')
    await page.waitForURL(url => url.pathname === '/')
  })

  test('token refresh after the 5 s TTL is invisible', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.waitForTimeout(6500)
    await page.goto('/users')
    await expect(page.getByTestId('users-table')).toContainText('@')
    await expect(page).toHaveURL(/\/users/)
  })

  test('logout clears access; back button shows no protected data', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.goto('/users')
    await expect(page.getByTestId('users-table')).toBeVisible()
    await page.getByRole('button', { name: 'User menu' }).first().click()
    await page.getByRole('menuitem', { name: 'Log out' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Log out' }).click()
    await page.waitForURL(/\/login/)
    await page.goBack()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByTestId('users-table')).toHaveCount(0)
  })

  test('logging out in one tab logs out the other', async ({ page, context }) => {
    await loginAndWait(page, 'admin')
    const other = await context.newPage()
    await other.goto('/users')
    await expect(other.getByTestId('users-table')).toBeVisible()
    await page.getByRole('button', { name: 'User menu' }).first().click()
    await page.getByRole('menuitem', { name: 'Log out' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Log out' }).click()
    await other.waitForURL(/\/login/)
  })

  test('forgot password shows a neutral confirmation', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.locator('input[type=email]').fill('someone@demo.test')
    await page.locator('form button[type=submit]').click()
    await expect(page.getByText('Check your inbox')).toBeVisible()
  })
})
