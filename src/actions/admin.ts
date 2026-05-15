'use server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') throw new Error('Not admin')
  return user
}

export async function getAllUsersWithUsage() {
  await requireAdmin()
  const supabase = await createServiceClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false })

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id, plan, monthly_limit_tokens, current_period_start, current_period_end')

  const { data: usage } = await supabase
    .from('token_usage')
    .select('user_id, tokens_used, created_at')

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
  await supabase
    .from('subscriptions')
    .update({ monthly_limit_tokens: newLimit })
    .eq('user_id', userId)
  revalidatePath('/admin/users')
}
