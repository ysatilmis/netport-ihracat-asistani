import { createClient, createServiceClient } from '@/lib/supabase/server'

export interface CreditBalance {
  credits: number
  plan: string
}

/**
 * Returns current credit balance for the user.
 * Throws if subscription row not found.
 */
export async function getCredits(userId: string): Promise<CreditBalance> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('credits, plan')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error('SUBSCRIPTION_NOT_FOUND')

  // No subscription row yet (new user, DB trigger not fired) — bootstrap via service role
  if (!data) {
    const serviceSupabase = await createServiceClient()
    const now = new Date().toISOString().split('T')[0]
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await serviceSupabase.from('subscriptions').insert({
      user_id: userId,
      plan: 'free',
      monthly_limit_tokens: 0,
      current_period_start: now,
      current_period_end: end,
      extra_tokens: 0,
      credits: 1,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    })
    return { credits: 1, plan: 'free' }
  }

  return { credits: data.credits, plan: data.plan }
}

/**
 * Throws 'INSUFFICIENT_CREDITS' if user has no credits.
 * Only enforced when ENFORCE_TOKEN_LIMITS=true.
 */
export async function checkCredits(userId: string): Promise<void> {
  if (process.env.ENFORCE_TOKEN_LIMITS !== 'true') return

  const { credits } = await getCredits(userId)
  if (credits <= 0) {
    throw new Error('INSUFFICIENT_CREDITS')
  }
}

/**
 * Atomically decrement user credits by 1 via Postgres RPC.
 * Returns remaining credits after decrement.
 * Throws 'INSUFFICIENT_CREDITS' if balance is 0.
 */
export async function spendCredit(userId: string): Promise<number> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("decrement_credits", {
    p_user_id: userId,
  }) as { data: number | null; error: { message?: string } | null }

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('INSUFFICIENT_CREDITS')) throw new Error('INSUFFICIENT_CREDITS')
    if (msg.includes('SUBSCRIPTION_NOT_FOUND')) throw new Error('SUBSCRIPTION_NOT_FOUND')
    throw new Error(msg || 'RPC_FAILED')
  }

  return data ?? 0
}

// ─── Legacy exports (kept for backward-compat, not used by new logic) ────────

/** @deprecated Use getCredits instead */
export async function getMonthlyUsage(userId: string) {
  const { credits, plan } = await getCredits(userId)
  return {
    used: 0,
    limit: credits,
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    plan: (plan === 'starter' || plan === 'pro' ? plan : 'free') as 'free' | 'starter' | 'pro',
  }
}

/** @deprecated Use checkCredits instead */
export async function checkTokenLimit(userId: string): Promise<void> {
  return checkCredits(userId)
}

export function isOverLimit(used: number, limit: number): boolean {
  return limit >= 0 && used >= limit
}

export function calculateRemainingReports(used: number, limit: number): number {
  if (limit < 0) return Number.POSITIVE_INFINITY
  return Math.max(0, limit - used)
}

/** @deprecated Cost analytics only */
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
