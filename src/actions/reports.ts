'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'

type ReportInsert = Database['public']['Tables']['reports']['Insert']
export type ReportRow = Database['public']['Tables']['reports']['Row']

export async function saveReport(data: {
  phase: number
  promptKey: string
  input_json: Record<string, string>
  output_text: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const insert: ReportInsert = {
    user_id: user.id,
    phase: data.phase,
    prompt_key: data.promptKey,
    input_json: data.input_json,
    output_text: data.output_text,
    report_sections: null,
    is_full_report: false,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('reports') as any).insert(insert)
  revalidatePath('/results')
}

export async function getReports(): Promise<ReportRow[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('reports') as any)
    .select('*')
    .order('created_at', { ascending: false }) as { data: ReportRow[] | null }
  return data ?? []
}
