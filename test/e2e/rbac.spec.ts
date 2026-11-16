import { expect, loginAndWait, test } from './fixtures'

test.describe('rbac', () => {
  test('viewer: no create/delete, 403 on /roles, no error toasts on /users', async ({ page }) => {
    await loginAndWait(page, 'viewer')
    await page.goto('/users')
    await expect(page.getByTestId('users-table')).toContainText('@')
    await expect(page.getByTestId('users-create')).toHaveCount(0)
    await expect(page.getByTestId('users-export')).toHaveCount(0)
    await expect(page.getByRole('checkbox')).toHaveCount(0)
    await expect(page.locator('[data-slot="title"]').filter({ hasText: /permission|wrong/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Roles & permissions' })).toHaveCount(0)
    await page.goto('/roles')
    await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
  })

  test('viewer dashboard hides revenue widgets', async ({ page }) => {
    await loginAndWait(page, 'viewer')
    await expect(page.getByTestId('kpi-orders')).toBeVisible()
    await expect(page.getByTestId('kpi-revenue')).toHaveCount(0)
    await expect(page.getByText('Revenue vs expenses')).toHaveCount(0)
  })

  test('manager sees roles read-only', async ({ page }) => {
    await loginAndWait(page, 'manager')
    await page.goto('/roles')
    await expect(page.getByRole('option').first()).toBeVisible()
    await expect(page.getByTestId('roles-create')).toHaveCount(0)
    await expect(page.getByTestId('roles-edit')).toHaveCount(0)
  })

  test('admin can create and delete a role', async ({ page }) => {
    await loginAndWait(page, 'admin')
    await page.goto('/roles')
    await page.getByTestId('roles-create').click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Display name').fill('Auditor')
    await dialog.getByLabel('Key').fill('auditor')
    await dialog.getByText('View users', { exact: true }).click()
    await dialog.getByRole('button', { name: 'New role' }).click()
    await expect(page.getByRole('option', { name: /Auditor/ })).toBeVisible()
    await page.getByRole('option', { name: /Auditor/ }).click()
    await page.getByTestId('roles-delete').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('option', { name: /Auditor/ })).toHaveCount(0)
  })

  test('noaccess user lands on /no-access', async ({ page }) => {
    await loginAndWait(page, 'noaccess')
    await expect(page.getByRole('heading', { name: /no permissions/ })).toBeVisible()
  })
})
