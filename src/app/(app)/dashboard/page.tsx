import { createClient } from '@/lib/supabase/server'
import { PhaseTabs } from '@/components/phase-tabs'
import type { Database } from '@/lib/supabase/types'

type PromptTemplate = Database['public']['Tables']['prompt_templates']['Row']
type UserProfile = Pick<Database['public']['Tables']['users']['Row'], 'product_name' | 'target_country' | 'full_name'>

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [templatesResult, profileResult] = await Promise.all([
    supabase.from('prompt_templates').select('*').order('display_order') as unknown as Promise<{ data: PromptTemplate[] | null }>,
    supabase.from('users').select('product_name, target_country, full_name').eq('id', user!.id).single() as unknown as Promise<{ data: UserProfile | null }>,
  ])

  const templates = templatesResult.data
  const profile = profileResult.data

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {firstName ? `Merhaba, ${firstName}` : 'İhracat Asistanı'}
          </h1>
        </div>
        <p style={{ color: 'var(--muted-foreground)' }} className="text-sm ml-4">
          3 aşamalı analiz metodolojisiyle ihracata hazır olun — araştırma, konumlandırma, ilk temas.
        </p>
      </div>
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
