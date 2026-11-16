import { expect, loginAndWait, test, toast } from './fixtures'

test.describe('errors', () => {
  test('unknown route shows the 404 view', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.goto('/definitely-not-here')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  test('error lab cases', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.goto('/dev/errors')
    await page.getByTestId('simulate-409').click()
    await expect(toast(page, 'The resource was modified by someone else.')).toBeVisible()
    await page.getByTestId('simulate-422').click()
    await expect(page.getByText('The email has already been taken.')).toBeVisible()
    await page.getByTestId('simulate-429').click()
    await expect(toast(page, /Too many requests/)).toBeVisible()
    await page.getByTestId('simulate-500').click()
    await expect(toast(page, 'Something went wrong on our side.')).toBeVisible()
    await page.getByTestId('simulate-403').click()
    await expect(toast(page, 'You do not have permission to do that.')).toBeVisible()
    await page.getByTestId('preview-404').click()
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  test('503 maintenance sends users to the maintenance page', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.goto('/dev/errors')
    await page.getByTestId('simulate-503').click()
    await page.waitForURL(/\/maintenance/)
    await expect(page.getByRole('heading', { name: 'Under maintenance' })).toBeVisible()
  })

  test('401 from the backend ends the session and redirects to login', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.goto('/dev/errors')
    await page.getByTestId('simulate-401').click()
    await page.waitForURL(/\/login\?reason=session_expired/)
    await expect(page.getByTestId('session-expired-banner')).toBeVisible()
  })
})
