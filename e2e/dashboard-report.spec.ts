import { test, expect } from '@playwright/test'

/**
 * @expensive — consumes real OpenRouter tokens (LLM calls).
 *
 * Full report-generation flow:
 *   product input → AI suggests 3 countries → pick one → SSE deep-dive stream → saved report.
 *
 * Token/provider limits are treated as a VALID outcome (the app is supposed to
 * gate them), not a hard failure — we assert the limit UI instead.
 */
test.describe('@expensive Full report generation', () => {
  // The SSE deep-dive streams ~10 sections; allow generous time.
  test.setTimeout(5 * 60_000)

  test('product → countries → pick → streamed report → saved', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for the dashboard to settle (either form or exhausted CTA).
    const productInput = page.locator('#product')
    const exhaustedCta = page.getByRole('link', { name: /Rapor Paketi Satın Al/i })

    await expect
      .poll(async () => {
        if (await productInput.isVisible().catch(() => false)) return 'form'
        if (await exhaustedCta.isVisible().catch(() => false)) return 'exhausted'
        return 'pending'
      }, { timeout: 20_000, intervals: [500] })
      .not.toBe('pending')

    // If the server-side gate is active, quota is verified — nothing more to test.
    if (await exhaustedCta.isVisible().catch(() => false)) {
      test.info().annotations.push({
        type: 'limit',
        description: 'User quota exhausted (server-side gate) — "Rapor Paketi Satın Al" CTA visible. ister-4 çalışıyor ✅',
      })
      test.skip(true, 'Quota exhausted server-side — gate verified, skipping rest')
    }

    // 1) Enter product and submit.
    await page.locator('#product').fill('organik zeytinyağı')
    await page.getByRole('button', { name: /Tam İhracat Raporu Oluştur/i }).click()

    // 2) Wait for either the country chooser OR a limit/error state.
    const countryHeader = page.getByRole('heading', { name: /Hangi pazara odaklanalım/i })
    const tokenLimitError = page.getByRole('link', { name: /Plan Yükselt/i })
    const providerLimit = page.getByRole('button', { name: /Tekrar dene/i })

    await expect
      .poll(async () => {
        if (await countryHeader.isVisible().catch(() => false)) return 'countries'
        if (await tokenLimitError.first().isVisible().catch(() => false)) return 'token-limit'
        if (await providerLimit.first().isVisible().catch(() => false)) return 'provider-limit'
        return 'pending'
      }, { timeout: 90_000, intervals: [2000] })
      .not.toBe('pending')

    // If a post-submit limit was hit, record it and stop.
    if (await tokenLimitError.first().isVisible().catch(() => false)) {
      test.info().annotations.push({
        type: 'limit',
        description: 'TOKEN_LIMIT_EXCEEDED post-submit — quota gate worked as designed.',
      })
      test.skip(true, 'Token limit reached — gate verified, skipping rest')
    }

    await expect(countryHeader).toBeVisible()

    // 3) Pick the first suggested country.
    const pickButton = page.getByRole('button', { name: /ile devam et/i }).first()
    await expect(pickButton).toBeVisible()
    await pickButton.click()

    // 4) Deep-dive phase: progress banner + selected market chip appear.
    await expect(page.getByText(/Seçilen pazar:/i)).toBeVisible({ timeout: 60_000 })

    // 5) Wait for completion — "Rapor otomatik kaydedildi" + Raporlarım link.
    await expect(
      page.getByText(/Rapor otomatik kaydedildi/i),
    ).toBeVisible({ timeout: 4 * 60_000 })

    const savedLink = page.getByRole('link', { name: /Raporlarım'da görüntüle/i })
    await expect(savedLink).toBeVisible()

    // 6) Follow the saved report and confirm it renders.
    await savedLink.click()
    await page.waitForURL(/\/results\/.+/, { timeout: 30_000 })
    await expect(page.locator('h1')).toBeVisible()
  })
})
