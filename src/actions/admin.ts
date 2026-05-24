'use server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PLAN_REPORT_LIMITS, type PlanTier } from '@/lib/stripe'
import type { Database } from '@/lib/supabase/types'

type UserRow = Database['public']['Tables']['users']['Row']
type SubRow = Database['public']['Tables']['subscriptions']['Row']
type UsageRow = Database['public']['Tables']['token_usage']['Row']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase())
  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    return user
  }

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

type ReportWithUser = Database['public']['Tables']['reports']['Row'] & {
  users: Pick<Database['public']['Tables']['users']['Row'], 'full_name' | 'email'> | null
}

export async function getAllReports(): Promise<ReportWithUser[]> {
  await requireAdmin()
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('reports') as any)
    .select('*, users(full_name, email)')
    .order('created_at', { ascending: false }) as { data: ReportWithUser[] | null }
  return data ?? []
}

export async function deleteAnyReport(reportId: string) {
  await requireAdmin()
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('reports') as any)
    .delete()
    .eq('id', reportId)
  revalidatePath('/admin/reports')
}

type PaymentRow = {
  id: string
  conversation_id: string
  user_id: string
  pack_id: string
  report_count: number
  price_try: number
  status: 'pending' | 'completed' | 'failed'
  iyzico_payment_id: string | null
  created_at: string
  completed_at: string | null
}

export async function getAdminDashboardKpis() {
  await requireAdmin()
  const supabase = await createServiceClient()

  // Use auth.admin to count ALL users, not just public.users
  let totalUsers = 0
  try {
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1 })
    // listUsers returns total in the response; if not available, fall back to public.users count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: publicCount } = await (supabase.from('users') as any).select('*', { count: 'exact', head: true }) as { count: number }
    totalUsers = Math.max(authUsers?.length ? (authUsers as unknown as { aud?: string }[]).length + (publicCount ?? 0) : publicCount ?? 0, publicCount ?? 0)
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase.from('users') as any).select('*', { count: 'exact', head: true }) as { count: number }
    totalUsers = count ?? 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalReports } = await (supabase.from('reports') as any).select('*', { count: 'exact', head: true }) as { count: number }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: fullReports } = await (supabase.from('reports') as any).select('*', { count: 'exact', head: true }).eq('is_full_report', true) as { count: number }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: premiumUsers } = await (supabase.from('subscriptions') as any).select('*', { count: 'exact', head: true }).in('plan', ['starter', 'pro']) as { count: number }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payments } = await (supabase.from('iyzico_pending_payments') as any)
    .select('price_try, status, created_at')
    .order('created_at', { ascending: false }) as { data: Pick<PaymentRow, 'price_try' | 'status' | 'created_at'>[] | null }

  const totalRevenue = (payments ?? [])
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.price_try), 0)
  const pendingRevenue = (payments ?? [])
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.price_try), 0)
  const paymentCount = (payments ?? []).filter(p => p.status === 'completed').length

  return {
    totalUsers,
    totalReports,
    fullReports,
    premiumUsers,
    totalRevenue,
    pendingRevenue,
    paymentCount,
  }
}

export async function getAllPayments() {
  await requireAdmin()
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('iyzico_pending_payments') as any)
    .select('*')
    .order('created_at', { ascending: false }) as { data: PaymentRow[] | null }
  return data ?? []
}

export async function getAdminRecentActivity() {
  await requireAdmin()
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentUsers } = await (supabase.from('users') as any)
    .select('id, email, full_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5) as { data: Pick<UserRow, 'id' | 'email' | 'full_name' | 'created_at'>[] | null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentReports } = await (supabase.from('reports') as any)
    .select('id, input_json, created_at, users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(5) as { data: (Pick<Database['public']['Tables']['reports']['Row'], 'id' | 'input_json' | 'created_at'> & { users: { full_name: string | null, email: string } | null })[] | null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentPayments } = await (supabase.from('iyzico_pending_payments') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5) as { data: PaymentRow[] | null }

  return {
    recentUsers: recentUsers ?? [],
    recentReports: recentReports ?? [],
    recentPayments: recentPayments ?? [],
  }
}

// Enhanced user list — uses auth.admin.listUsers() to catch users missing from public.users
export async function getAllUsersDetailed() {
  await requireAdmin()
  const supabase = await createServiceClient()

  // Fetch all auth users (service_role gives access to auth.admin)
  let authUsers: { id: string; email: string; created_at: string; user_metadata?: { full_name?: string } }[] = []
  try {
    const { data } = await supabase.auth.admin.listUsers()
    authUsers = (data?.users ?? []) as unknown as typeof authUsers
  } catch (err) {
    console.error('[admin] auth.admin.listUsers failed:', err)
    // fallback: just public.users
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: publicUsers } = await (supabase.from('users') as any)
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false }) as { data: Pick<UserRow, 'id' | 'email' | 'full_name' | 'role' | 'created_at'>[] | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subs } = await (supabase.from('subscriptions') as any)
    .select('*') as { data: (SubRow & { extra_tokens: number })[] | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reportCounts } = await (supabase.from('reports') as any)
    .select('user_id, id') as { data: Pick<Database['public']['Tables']['reports']['Row'], 'user_id' | 'id'>[] | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payments } = await (supabase.from('iyzico_pending_payments') as any)
    .select('user_id, price_try, status') as { data: Pick<PaymentRow, 'user_id' | 'price_try' | 'status'>[] | null }

  const reportCountMap = new Map<string, number>()
  for (const r of reportCounts ?? []) {
    reportCountMap.set(r.user_id, (reportCountMap.get(r.user_id) ?? 0) + 1)
  }

  const paymentMap = new Map<string, { count: number; total: number }>()
  for (const p of payments ?? []) {
    if (p.status === 'completed') {
      const cur = paymentMap.get(p.user_id) ?? { count: 0, total: 0 }
      cur.count++
      cur.total += Number(p.price_try)
      paymentMap.set(p.user_id, cur)
    }
  }

  const publicUserMap = new Map((publicUsers ?? []).map(u => [u.id, u]))

  function calcReportLimit(sub: (SubRow & { extra_tokens: number }) | null | undefined): number {
    if (!sub) return 0
    const plan = (sub.plan === 'starter' || sub.plan === 'pro') ? (sub.plan as PlanTier) : 'free'
    const planLimit = PLAN_REPORT_LIMITS[plan] ?? 0
    const extra = sub.extra_tokens ?? 0
    const adminOverride = sub.monthly_limit_tokens ?? 0
    const baseLimit = (adminOverride > 0 && adminOverride <= 1000) ? adminOverride : planLimit
    return baseLimit < 0 ? -1 : baseLimit + extra
  }

  // Merge: start with auth users, enrich with public.users data
  const merged = new Map<string, {
    id: string
    email: string
    full_name: string | null
    role: string
    created_at: string
    sub: SubRow & { extra_tokens: number } | null
    reportCount: number
    reportLimit: number
    paymentCount: number
    paymentTotal: number
  }>()
  for (const au of authUsers) {
    const pu = publicUserMap.get(au.id)
    const pmt = paymentMap.get(au.id)
    const sub = subs?.find(s => s.user_id === au.id)
    merged.set(au.id, {
      id: au.id,
      email: au.email ?? pu?.email ?? '?',
      full_name: pu?.full_name ?? au.user_metadata?.full_name ?? null,
      role: pu?.role ?? 'user',
      created_at: pu?.created_at ?? au.created_at,
      sub: sub ?? null,
      reportCount: reportCountMap.get(au.id) ?? 0,
      reportLimit: calcReportLimit(sub),
      paymentCount: pmt?.count ?? 0,
      paymentTotal: pmt?.total ?? 0,
    })
  }

  // Add any public.users not in auth (shouldn't happen but defensive)
  for (const pu of publicUsers ?? []) {
    if (!merged.has(pu.id)) {
      const pmt = paymentMap.get(pu.id)
      const sub = subs?.find(s => s.user_id === pu.id)
      merged.set(pu.id, {
        id: pu.id,
        email: pu.email,
        full_name: pu.full_name,
        role: pu.role,
        created_at: pu.created_at,
        sub: sub ?? null,
        reportCount: reportCountMap.get(pu.id) ?? 0,
        reportLimit: calcReportLimit(sub),
        paymentCount: pmt?.count ?? 0,
        paymentTotal: pmt?.total ?? 0,
      })
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}
