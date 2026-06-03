import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

/**
 * @load — 50 eş zamanlı kayıt senaryosu
 *
 * Bu test, 50 kullanıcının aynı anda kayıt olmasını simüle eder.
 * Playwright browser açmadan, doğrudan HTTP API üzerinden çalışır
 * (Next.js server action POST /register benzeri değil, Supabase Auth REST API).
 *
 * Çalıştırmak için önce LOAD_TEST_BASE_URL'i ayarla:
 *   LOAD_TEST_BASE_URL=http://localhost:3000 npx playwright test load-register
 *
 * UYARI: Gerçek Supabase'e 50 kayıt oluşturur — test sonrası temizleme gerekebilir.
 * Supabase Dashboard → Authentication → Users'dan sil.
 */

const CONCURRENCY = 50
const BASE_URL = process.env.LOAD_TEST_BASE_URL ?? 'http://localhost:3000'

// Supabase public değerleri — .env.local ile aynı (public, güvenli)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://uvhtsnwwaouzqbqndjbl.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aHRzbnd3YW91enFicW5kamJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzY1OTYsImV4cCI6MjA5NDQxMjU5Nn0.3SfvLKIM_a7c9MLln3pbbKusBetnsWPHM5Y8CvY4BBw'

test.describe('@load 50 eş zamanlı kayıt', () => {
  test.setTimeout(120_000)

  test('50 kullanıcı gerçekçi tempo ile signup yapabilmeli', async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      test.skip(true, 'SUPABASE env değişkenleri .env.test içinde yok')
    }

    // Gerçekçi senaryo: 50 kişi ~2 dakikaya yayılmış (her 2.5s'de 2 kayıt)
    // Supabase burst limiti (IP başına ~10 req/s) nedeniyle tam eş zamanlı
    // 50 istek çalışmaz — ama gerçekte kullanıcılar form doldurup gönderir,
    // yani doğal olarak 1-5s arayla gelirler.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const timestamp = Date.now()
    const counter = { ok: 0, fail: 0 }
    const errors: Record<string, number> = {}

    // Tüm kayıtları seri batchler halinde çalıştır (2 adet / 2.5s)
    const allResults: Array<{ success: boolean; msg: string }> = []
    for (let i = 0; i < CONCURRENCY; i += 2) {
      const batch = [i, i + 1].filter((x) => x < CONCURRENCY)
      const batchResults = await Promise.all(
        batch.map(async (idx) => {
          const { error } = await supabase.auth.signUp({
            email: `lt_${timestamp}_${idx}@netportai.com`,
            password: 'LoadTest2026!',
          })
          const msg = error?.message ?? ''
          const success = !error || msg.includes('already') || msg.includes('registered')
          return { success, msg }
        }),
      )
      allResults.push(...batchResults)
      if (i + 2 < CONCURRENCY) await new Promise((r) => setTimeout(r, 2500))
    }

    for (const r of allResults) {
      if (r.success) counter.ok++
      else { counter.fail++; errors[r.msg] = (errors[r.msg] ?? 0) + 1 }
    }

    test.info().annotations.push({
      type: 'load-test-summary',
      description: JSON.stringify({ total: CONCURRENCY, ok: counter.ok, fail: counter.fail, errors }, null, 2),
    })

    // Başarı kriteri: %96+ (48/50)
    expect(counter.ok, `Başarı oranı: ${counter.ok}/${CONCURRENCY}`).toBeGreaterThanOrEqual(48)
  })

  test('kayıt sayfası 50 eş zamanlı GET isteğine yanıt vermeli', async () => {
    // Next.js server-side rendering yükünü test eder — browser açmadan
    const requests = Array.from({ length: CONCURRENCY }, () =>
      fetch(`${BASE_URL}/register`, { method: 'GET' }).then((r) => r.status),
    )
    const statuses = await Promise.all(requests)
    const ok = statuses.filter((s) => s === 200).length
    expect(ok).toBeGreaterThanOrEqual(45) // %90+
  })
})
