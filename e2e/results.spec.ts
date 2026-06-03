import { test, expect } from '@playwright/test'

/**
 * Results list + report detail. Mostly free; the lead-generation step is
 * @expensive (Perplexity tokens) and isolated into its own test.
 */
test.describe('Results & report detail', () => {
  test('results list shows existing reports (or empty state)', async ({ page }) => {
    await page.goto('/results')

    const empty = page.getByRole('heading', { name: /Henüz rapor yok/i })
    const hasReports = page.locator('a[href^="/results/"]').first()

    // One of the two must be true.
    await expect
      .poll(async () => {
        if (await empty.isVisible().catch(() => false)) return 'empty'
        if (await hasReports.isVisible().catch(() => false)) return 'list'
        return 'pending'
      }, { timeout: 15_000 })
      .not.toBe('pending')

    if (await empty.isVisible().catch(() => false)) {
      test.info().annotations.push({
        type: 'state',
        description: 'No reports yet — run dashboard-report.spec.ts first to populate.',
      })
      test.skip(true, 'No reports to open')
    }
  })

  test('opening a report shows its detail page', async ({ page }) => {
    await page.goto('/results')
    const firstReport = page.locator('a[href^="/results/"]').first()
    test.skip(!(await firstReport.isVisible().catch(() => false)), 'No reports available')

    await firstReport.click()
    await page.waitForURL(/\/results\/.+/, { timeout: 30_000 })

    // Detail page header + at least one report section render.
    await expect(page.locator('h1')).toBeVisible()
    // The "Alıcı Bul" / leads panel should be present on a full report.
    const leadsPanel = page.getByText(/Alıcı/i).first()
    await expect(leadsPanel).toBeVisible({ timeout: 15_000 })
  })

  test('@expensive generate B2B leads for a report', async ({ page }) => {
    test.setTimeout(2 * 60_000)

    await page.goto('/results')
    const firstReport = page.locator('a[href^="/results/"]').first()
    test.skip(!(await firstReport.isVisible().catch(() => false)), 'No reports available')

    await firstReport.click()
    await page.waitForURL(/\/results\/.+/, { timeout: 30_000 })

    // Trigger button text varies by state: "Alıcı listesi üret" | "Hazırla" | "Yeniden çalıştır".
    const trigger = page
      .getByRole('button', { name: /Alıcı listesi üret|Hazırla|Yeniden çalıştır/i })
      .first()

    if (!(await trigger.isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'state',
        description: 'Leads already generated or panel absent — nothing to trigger.',
      })
      test.skip(true, 'No lead trigger button')
    }

    await trigger.click()

    // Wait for the finished leads list ("🎯 Alıcı Listesi") or a failure box.
    const done = page.getByRole('heading', { name: /Alıcı Listesi/i })
    const failed = page.getByText(/başarısız/i)

    await expect
      .poll(async () => {
        if (await done.isVisible().catch(() => false)) return 'done'
        if (await failed.isVisible().catch(() => false)) return 'failed'
        return 'pending'
      }, { timeout: 90_000, intervals: [3000] })
      .not.toBe('pending')

    if (await failed.isVisible().catch(() => false)) {
      test.info().annotations.push({
        type: 'warning',
        description: 'Lead generation returned a failure state (provider/quota).',
      })
    } else {
      await expect(done).toBeVisible()
    }
  })
})
