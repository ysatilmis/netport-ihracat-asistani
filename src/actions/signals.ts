'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SignalRow {
  id: string
  report_id: string
  detected_at: string
  signal_type: string
  severity: number
  summary: string
  detail: string
  is_resolved: boolean
}

export async function getUnresolvedSignalCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase.from('report_signals') as any)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_resolved', false)

  return Number(count ?? 0)
}

export async function getSignalsForReport(reportId: string): Promise<SignalRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('report_signals') as any)
    .select('id, report_id, detected_at, signal_type, severity, summary, detail, is_resolved')
    .eq('user_id', user.id)
    .eq('report_id', reportId)
    .neq('signal_type', 'baseline')
    .order('detected_at', { ascending: false })

  return (data ?? []) as SignalRow[]
}

export async function resolveSignal(signalId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('report_signals') as any)
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq('id', signalId)
    .eq('user_id', user.id)

  revalidatePath('/results')
  revalidatePath(`/results/${signalId}`)
}
