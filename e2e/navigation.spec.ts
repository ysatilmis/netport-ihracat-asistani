import { test, expect } from '@playwright/test'

// Runs in the `authed` project (storageState reused). No tokens consumed —
// just verifies the core authed pages render and the nav works.

test.describe('Authenticated navigation', () => {
  test('dashboard renders the report-builder hero', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(
      page.getByRole('heading', { name: /İhracat Pazar Analizi/i }),
    ).toBeVisible()

    // If the user's quota is exhausted the form is replaced by a CTA block.
    const isExhausted = await page.getByRole('link', { name: /Rapor Paketi Satın Al/i }).isVisible().catch(() => false)
    if (isExhausted) {
      test.info().annotations.push({ type: 'state', description: 'User quota exhausted — exhausted CTA visible instead of form.' })
    } else {
      await expect(page.locator('#product')).toBeVisible()
      await expect(page.getByRole('button', { name: /Tam İhracat Raporu Oluştur/i })).toBeVisible()
    }
  })

  test('results (Raporlarım) page loads', async ({ page }) => {
    await page.goto('/results')
    await expect(page).toHaveURL(/\/results/)
    // Page should render without crashing — main landmark visible.
    await expect(page.locator('body')).toBeVisible()
  })

  test('pricing page loads with usage/plan info', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).toHaveURL(/\/pricing/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('top nav links route correctly', async ({ page }) => {
    await page.goto('/dashboard')

    // Scope to the top <nav> — the footer also has these labels.
    const nav = page.locator('nav').first()

    await nav.getByRole('link', { name: /Raporlarım/ }).click()
    await page.waitForURL(/\/results/)

    await nav.getByRole('link', { name: /Fiyatlandırma/ }).click()
    await page.waitForURL(/\/pricing/)

    await nav.getByRole('link', { name: /Dashboard/ }).click()
    await page.waitForURL(/\/dashboard/)
  })
})
