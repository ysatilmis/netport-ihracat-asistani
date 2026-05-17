'use server'
import { createClient } from '@/lib/supabase/server'

export interface QualityFlagRow {
  section: string
  type: string
  severity: number
  excerpt: string
  reason: string
  suggestion?: string
}

export interface QualityCheckRow {
  id: string
  report_id: string
  overall_score: number
  flags_json: QualityFlagRow[]
  summary: string
  status: 'pending' | 'running' | 'done' | 'failed'
  error_message: string | null
  tokens_used: number
  updated_at: string
}

export async function getQualityCheck(reportId: string): Promise<QualityCheckRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('quality_checks') as any)
    .select('id, report_id, overall_score, flags_json, summary, status, error_message, tokens_used, updated_at')
    .eq('user_id', user.id)
    .eq('report_id', reportId)
    .maybeSingle()

  return data as QualityCheckRow | null
}
