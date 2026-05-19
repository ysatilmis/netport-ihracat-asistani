// Cron veya service-mode request olduğunu doğrular.
// İki kabul edilen kanal:
// 1. Vercel Cron Job: `x-vercel-cron-signature` header otomatik gelir.
// 2. Bearer token (manual/service): `Authorization: Bearer <CRON_SECRET>`.
//
// Kullanım:
//   const auth = checkCronAuth(request)
//   if (auth.kind === 'reject') return new Response('Unauthorized', { status: 401 })
//
// auth.kind === 'service' ise endpoint service mode davranır (RLS bypass için
// createServiceClient kullan). auth.kind === 'user' ise normal kullanıcı oturumu.

export type CronAuthResult =
  | { kind: 'service'; source: 'cron' | 'bearer' }
  | { kind: 'user' }
  | { kind: 'reject' }

export function checkCronAuth(request: Request): CronAuthResult {
  // 1) Vercel Cron Job — signature header otomatik enjekte edilir.
  // https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
  const vercelCronSig = request.headers.get('x-vercel-cron-signature')
  if (vercelCronSig) {
    return { kind: 'service', source: 'cron' }
  }

  // 2) Bearer token — manuel/service çağrılar için.
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (secret && auth === `Bearer ${secret}`) {
    return { kind: 'service', source: 'bearer' }
  }

  // 3) Hiçbir cron/service kanalı yok → endpoint normal user auth ile devam etmeli.
  return { kind: 'user' }
}

// Sadece cron/service kabul eden endpoint'ler için sıkı varyant.
// User auth bile reject edilir.
export function requireCronOrService(request: Request): CronAuthResult {
  const result = checkCronAuth(request)
  if (result.kind === 'user') return { kind: 'reject' }
  return result
}
