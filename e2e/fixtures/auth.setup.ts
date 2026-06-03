import { test as setup, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const authFile = path.join(__dirname, '..', '.auth', 'user.json')

const EMAIL = process.env.TEST_USER_EMAIL
const PASSWORD = process.env.TEST_USER_PASSWORD

/**
 * Logs in once with the real test user and persists the Supabase session
 * (cookies + localStorage) to e2e/.auth/user.json. The `authed` Playwright
 * project reuses this storageState so individual specs don't re-login.
 */
setup('authenticate', async ({ page }) => {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'TEST_USER_EMAIL / TEST_USER_PASSWORD missing. Add them to .env.test',
    )
  }

  await page.goto('/login')
  await expect(page.locator('#email')).toBeVisible()

  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /Giriş Yap/i }).click()

  // Successful login redirects to /dashboard (server action redirect).
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })

  // Sanity: the dashboard hero must render for a valid session.
  await expect(
    page.getByRole('heading', { name: /İhracat Pazar Analizi/i }),
  ).toBeVisible({ timeout: 15_000 })

  fs.mkdirSync(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
