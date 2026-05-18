'use server'
import { createClient } from '@/lib/supabase/server'
import type { Lead } from '@/lib/lead-finder'

export interface LeadsRow {
  id: string
  report_id: string
  leads_json: Lead[]
  status: 'pending' | 'running' | 'done' | 'failed'
  error_message: string | null
  tokens_used: number
  model: string
  updated_at: string
}

export async function getLeads(reportId: string): Promise<LeadsRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('report_leads') as any)
    .select('id, report_id, leads_json, status, error_message, tokens_used, model, updated_at')
    .eq('user_id', user.id)
    .eq('report_id', reportId)
    .maybeSingle()

  return data as LeadsRow | null
}
