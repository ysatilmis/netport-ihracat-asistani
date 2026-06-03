import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

// Load test credentials (TEST_USER_EMAIL / TEST_USER_PASSWORD) from .env.test
loadEnv({ path: '.env.test' })

const PORT = process.env.PORT ?? '3000'
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  // AI report streaming (SSE) can run long — generous default, expensive
  // specs override per-test with test.setTimeout().
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // 1) Logs in once and persists storageState for the authed projects.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // 2) Auth flow tests run with a fresh (no storage) context.
    // 3) Everything that needs a logged-in user reuses the saved session.
    //    Runs before `auth` so the logout test can't invalidate the shared
    //    Supabase session (signOut revokes the refresh token globally).
    {
      name: 'authed',
      testIgnore: [/auth\.spec\.ts/, /auth\.setup\.ts/, /load-register\.spec\.ts/],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
    },
    // 4) Fresh-context auth flow (login/logout/redirect). Last, because its
    //    logout step revokes the session shared with the `authed` project.
    {
      name: 'auth',
      testMatch: /auth\.spec\.ts/,
      dependencies: ['authed'],
      use: { ...devices['Desktop Chrome'] },
    },
    // 5) Load test — no browser, no storageState needed. Run separately with --grep @load.
    {
      name: 'load',
      testMatch: /load-register\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
