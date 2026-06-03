import { test, expect } from '@playwright/test'

// Health sweep across the authed pages: collects console errors, page errors,
// and failed network requests. No tokens consumed.

const PAGES = ['/dashboard', '/results', '/pricing']

// Known-noisy console messages we don't want to fail on (third-party, dev HMR).
const IGNORE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /hydration/i, // surfaced separately if it becomes a real problem
]

for (const path of PAGES) {
  test(`no critical console/page errors on ${path}`, async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const failedRequests: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!IGNORE.some((re) => re.test(text))) consoleErrors.push(text)
      }
    })
    page.on('pageerror', (err) => pageErrors.push(err.message))
    page.on('requestfailed', (req) => {
      const failure = req.failure()?.errorText ?? 'unknown'
      // Ignore aborted/cancelled (navigation churn).
      if (!/aborted|ERR_ABORTED/i.test(failure)) {
        failedRequests.push(`${req.method()} ${req.url()} — ${failure}`)
      }
    })

    await page.goto(path, { waitUntil: 'networkidle' })
    await expect(page.locator('body')).toBeVisible()

    // Attach findings to the report for visibility even when passing.
    if (consoleErrors.length || pageErrors.length || failedRequests.length) {
      test.info().annotations.push({
        type: 'health',
        description: JSON.stringify(
          { path, consoleErrors, pageErrors, failedRequests },
          null,
          2,
        ),
      })
    }

    // Hard fail only on uncaught JS exceptions (pageerror) — those are bugs.
    expect(pageErrors, `Uncaught JS errors on ${path}`).toEqual([])
  })
}
