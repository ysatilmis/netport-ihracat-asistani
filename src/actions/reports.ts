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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('reports') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: ReportRow[] | null }
  return data ?? []
}

export async function deleteReport(reportId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Yetkisiz')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('reports') as any)
    .delete()
    .eq('id', reportId)
    .eq('user_id', user.id)

  if (error) throw new Error(`Rapor silinemedi: ${error.message}`)
  revalidatePath('/results')
}

export async function saveFullReport(data: {
  product: string
  country: string
  sections: Record<string, { title: string; text: string; phase: number }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const outputText = Object.values(data.sections)
    .map((s) => `## ${s.title}\n\n${s.text}`)
    .join('\n\n---\n\n')

  const insert: ReportInsert = {
    user_id: user.id,
    phase: 0,
    prompt_key: 'full_report',
    input_json: { product: data.product, country: data.country },
    output_text: outputText,
    report_sections: data.sections,
    is_full_report: true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report } = await (supabase.from('reports') as any)
    .insert(insert).select('id').single() as { data: { id: string } | null }

  revalidatePath('/results')
  return report?.id ?? null
}
