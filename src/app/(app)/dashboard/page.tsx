import { createClient } from '@/lib/supabase/server'
import { PhaseTabs } from '@/components/phase-tabs'
import type { Database } from '@/lib/supabase/types'

type PromptTemplate = Database['public']['Tables']['prompt_templates']['Row']
type UserProfile = Pick<Database['public']['Tables']['users']['Row'], 'product_name' | 'target_country'>

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [templatesResult, profileResult] = await Promise.all([
    supabase.from('prompt_templates').select('*').order('display_order') as unknown as Promise<{ data: PromptTemplate[] | null }>,
    supabase.from('users').select('product_name, target_country').eq('id', user!.id).single() as unknown as Promise<{ data: UserProfile | null }>,
  ])

  const templates = templatesResult.data
  const profile = profileResult.data

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">İhracat Asistanı</h1>
      <p className="text-slate-500 mb-8 text-sm">
        Ürününüz ve hedef ülkeniz için yapay zeka destekli pazar analizi yapın.
      </p>
      <PhaseTabs
        templates={templates ?? []}
        defaultInputs={{
          ürün: profile?.product_name ?? '',
          ülke: profile?.target_country ?? '',
        }}
      />
    </div>
  )
}
