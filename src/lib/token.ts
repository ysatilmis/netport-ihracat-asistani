import { createClient } from '@/lib/supabase/server'

export function isOverLimit(used: number, limit: number): boolean {
  return used >= limit
}

export function calculateRemainingTokens(used: number, limit: number): number {
  return Math.max(0, limit - used)
}

export async function getMonthlyUsage(userId: string): Promise<{
  used: number
  limit: number
  periodStart: string
  periodEnd: string
}> {
  const supabase = await createClient()

  type SubRow = Pick<
    import('@/lib/supabase/types').Database['public']['Tables']['subscriptions']['Row'],
    'monthly_limit_tokens' | 'current_period_start' | 'current_period_end'
  >
  type UsageRow = Pick<
    import('@/lib/supabase/types').Database['public']['Tables']['token_usage']['Row'],
    'tokens_used'
  >

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('monthly_limit_tokens, current_period_start, current_period_end')
    .eq('user_id', userId)
    .single() as { data: SubRow | null; error: unknown }

  if (!sub) throw new Error('Subscription not found')

  const { data: usage } = await supabase
    .from('token_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('created_at', sub.current_period_start)
    .lte('created_at', sub.current_period_end) as { data: UsageRow[] | null; error: unknown }

  const used = usage?.reduce((sum, row) => sum + row.tokens_used, 0) ?? 0

  return {
    used,
    limit: sub.monthly_limit_tokens,
    periodStart: sub.current_period_start,
    periodEnd: sub.current_period_end,
  }
}

export async function checkTokenLimit(_userId: string): Promise<void> {
  // Pilot aşaması — limit kontrolü kapalı. Ticari lansmanla aktif edilecek.
}

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
