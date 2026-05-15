'use server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'

type UserRow = Database['public']['Tables']['users']['Row']
type SubRow = Database['public']['Tables']['subscriptions']['Row']
type UsageRow = Database['public']['Tables']['token_usage']['Row']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('users') as any).select('role').eq('id', user.id).single() as { data: Pick<UserRow, 'role'> | null }
  if (data?.role !== 'admin') throw new Error('Not admin')
  return user
}

export async function getAllUsersWithUsage() {
  await requireAdmin()
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users } = await (supabase.from('users') as any)
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false }) as { data: Pick<UserRow, 'id' | 'email' | 'full_name' | 'role' | 'created_at'>[] | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subs } = await (supabase.from('subscriptions') as any)
    .select('user_id, plan, monthly_limit_tokens, current_period_start, current_period_end') as { data: Pick<SubRow, 'user_id' | 'plan' | 'monthly_limit_tokens' | 'current_period_start' | 'current_period_end'>[] | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usage } = await (supabase.from('token_usage') as any)
    .select('user_id, tokens_used, created_at') as { data: Pick<UsageRow, 'user_id' | 'tokens_used' | 'created_at'>[] | null }

  return (users ?? []).map((u) => {
    const sub = subs?.find((s) => s.user_id === u.id)
    const periodUsage = usage
      ?.filter((t) => t.user_id === u.id &&
        sub && t.created_at >= sub.current_period_start &&
        t.created_at <= sub.current_period_end)
      .reduce((sum, t) => sum + t.tokens_used, 0) ?? 0
    return { ...u, sub, periodUsage }
  })
}

export async function updateUserLimit(userId: string, newLimit: number) {
  await requireAdmin()
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('subscriptions') as any)
    .update({ monthly_limit_tokens: newLimit })
    .eq('user_id', userId)
  revalidatePath('/admin/users')
}
