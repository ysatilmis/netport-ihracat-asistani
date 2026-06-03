import { test, expect } from '@playwright/test'

// The test user (umutsahinkaya1@gmail.com) is also in ADMIN_EMAIL, so the
// reused session can reach /admin/*. No tokens consumed.

test.describe('Admin panel', () => {
  test('admin dashboard (Genel Bakış) loads', async ({ page }) => {
    await page.goto('/admin')
    // Must NOT be bounced to /admin/login (would mean admin check failed).
    await expect(page).not.toHaveURL(/\/admin\/login/)
    await expect(
      page.getByRole('heading', { name: /Genel Bakış/i }),
    ).toBeVisible()
  })

  test('all reports page loads', async ({ page }) => {
    await page.goto('/admin/reports')
    await expect(page).not.toHaveURL(/\/admin\/login/)
    await expect(
      page.getByRole('heading', { name: /Tüm Raporlar/i }),
    ).toBeVisible()
  })

  test('users page loads', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page).not.toHaveURL(/\/admin\/login/)
    await expect(
      page.getByRole('heading', { name: /Kullanıcılar/i }),
    ).toBeVisible()
  })

  test('payments page loads', async ({ page }) => {
    await page.goto('/admin/payments')
    await expect(page).not.toHaveURL(/\/admin\/login/)
    await expect(
      page.getByRole('heading', { name: /Ödemeler/i }),
    ).toBeVisible()
  })
})
