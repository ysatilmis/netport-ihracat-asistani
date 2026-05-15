import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('product_name, target_country, full_name')
    .eq('id', user!.id)
    .single() as {
      data: { product_name: string | null; target_country: string | null; full_name: string | null } | null
      error: unknown
    }

  return (
    <DashboardClient
      defaultProduct={profile?.product_name ?? ''}
      defaultCountry={profile?.target_country ?? ''}
    />
  )
}
