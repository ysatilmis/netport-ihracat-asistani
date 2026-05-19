import { createClient } from '@/lib/supabase/server'
import { PLAN_REPORT_LIMITS, type PlanTier } from '@/lib/stripe'

export function isOverLimit(used: number, limit: number): boolean {
  // -1 = unlimited (Pro tier)
  if (limit < 0) return false
  return used >= limit
}

export function calculateRemainingReports(used: number, limit: number): number {
  if (limit < 0) return Number.POSITIVE_INFINITY
  return Math.max(0, limit - used)
}

/**
 * Mevcut billing periyodundaki rapor kullanımını hesaplar.
 *
 * (2026-05-19'da yeniden yazıldı: önce token sum'lardı, artık reports.is_full_report=true
 *  rows'unu count'lar. token_usage tablosu silinmedi — internal cost analytics için kalıyor.)
 *
 * Limit = PLAN_REPORT_LIMITS[plan] + extra_tokens (extra_reports semantik)
 * Used  = reports tablosunda current period içinde is_full_report=true row sayısı
 */
export async function getMonthlyUsage(userId: string): Promise<{
  used: number
  limit: number
  periodStart: string
  periodEnd: string
  plan: PlanTier
}> {
  const supabase = await createClient()

  type SubRow = Pick<
    import('@/lib/supabase/types').Database['public']['Tables']['subscriptions']['Row'],
    'plan' | 'monthly_limit_tokens' | 'current_period_start' | 'current_period_end'
  > & { extra_tokens?: number | null }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, monthly_limit_tokens, current_period_start, current_period_end, extra_tokens')
    .eq('user_id', userId)
    .single() as { data: SubRow | null; error: unknown }

  if (!sub) throw new Error('Subscription not found')

  const plan: PlanTier =
    sub.plan === 'starter' || sub.plan === 'pro' ? (sub.plan as PlanTier) : 'free'

  // reports tablosunda current period içinde is_full_report=true count.
  // count: 'exact', head: true → row dönmez, sadece sayı.
  const { count } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_full_report', true)
    .gte('created_at', sub.current_period_start)
    .lte('created_at', sub.current_period_end + 'T23:59:59.999Z')

  const used = count ?? 0
  const planLimit = PLAN_REPORT_LIMITS[plan] ?? 3
  const extra = sub.extra_tokens ?? 0 // semantik: extra_reports

  // Pro = sınırsız (planLimit = -1) — extra eklenmiş olsa bile sınırsız kalır
  const limit = planLimit < 0 ? -1 : planLimit + extra

  return {
    used,
    limit,
    periodStart: sub.current_period_start,
    periodEnd: sub.current_period_end,
    plan,
  }
}

/**
 * Yeni rapor üretimi öncesi kontenjan kontrolü.
 * ENFORCE_TOKEN_LIMITS env true ise: limit aşıldıysa TOKEN_LIMIT_EXCEEDED hatası atar.
 * (Hata adı backward-compat için TOKEN_LIMIT_EXCEEDED kalıyor — client error code'u
 *  burada okuyor; rename eylemi sonraki sprint için.)
 */
export async function checkTokenLimit(userId: string): Promise<void> {
  if (process.env.ENFORCE_TOKEN_LIMITS !== 'true') return

  const { used, limit } = await getMonthlyUsage(userId)
  if (isOverLimit(used, limit)) {
    throw new Error('TOKEN_LIMIT_EXCEEDED')
  }
}

/**
 * Per-LLM-çağrı token kaydı — cost analytics için.
 * Quota tüketimi artık BU function'a değil, reports tablosundaki is_full_report=true
 * row insertion'ına bağlı (auto-save flow at end of api/report/route.ts).
 */
export async function recordTokenUsage(
  userId: string,
  phase: 1 | 2 | 3 | 4,
  promptKey: string,
  tokensUsed: number,
  model: string
): Promise<void> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('token_usage') as any).insert({
    user_id: userId,
    phase,
    prompt_key: promptKey,
    tokens_used: tokensUsed,
    model,
  })
}
