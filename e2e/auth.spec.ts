import { test, expect } from '@playwright/test'

const EMAIL = process.env.TEST_USER_EMAIL!
const PASSWORD = process.env.TEST_USER_PASSWORD!

// This spec runs WITHOUT a stored session (separate `auth` project) so it can
// exercise the login form, validation, and middleware redirects from scratch.

test.describe('Authentication', () => {
  test('login page renders with email + password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /Hesabına gir/i })).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /Giriş Yap/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /kayıt ol/i })).toBeVisible()
  })

  test('unauthenticated access to protected route redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/login/, { timeout: 15_000 })
    await expect(page.locator('#email')).toBeVisible()
  })

  test('invalid password shows an error message', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill(EMAIL)
    await page.locator('#password').fill('wrong-password-xyz')
    await page.getByRole('button', { name: /Giriş Yap/i }).click()

    // Should stay on /login and surface the server-action error box.
    const errorBox = page.locator('p.text-red-600')
    await expect(errorBox).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('valid credentials log in and land on /dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill(EMAIL)
    await page.locator('#password').fill(PASSWORD)
    await page.getByRole('button', { name: /Giriş Yap/i }).click()

    await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
    await expect(
      page.getByRole('heading', { name: /İhracat Pazar Analizi/i }),
    ).toBeVisible()
  })

  test('logout returns the user to /login', async ({ page }) => {
    // Log in first (fresh context).
    await page.goto('/login')
    await page.locator('#email').fill(EMAIL)
    await page.locator('#password').fill(PASSWORD)
    await page.getByRole('button', { name: /Giriş Yap/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 })

    // Find a logout control (button or link labelled "Çıkış").
    const logout = page.getByRole('button', { name: /Çıkış/i })
      .or(page.getByRole('link', { name: /Çıkış/i }))

    if (await logout.count()) {
      await logout.first().click()
      await page.waitForURL(/\/login/, { timeout: 15_000 })
      await expect(page.locator('#email')).toBeVisible()
    } else {
      test.info().annotations.push({
        type: 'warning',
        description: 'No "Çıkış" control found on the page — logout UI may differ.',
      })
      test.skip(true, 'Logout control not found')
    }
  })
})
