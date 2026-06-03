import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard-client'
import { getCredits } from '@/lib/token'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const profilePromise = (supabase
    .from('users')
    .select('product_name, full_name')
    .eq('id', user!.id)
    .single() as unknown as Promise<{
      data: { product_name: string | null; full_name: string | null } | null
      error: unknown
    }>)

  const limitsActive = process.env.ENFORCE_TOKEN_LIMITS === 'true'

  const [profileResult, exhausted] = await Promise.all([
    profilePromise,
    limitsActive
      ? getCredits(user!.id)
          .then(({ credits }) => credits <= 0)
          .catch(() => false)
      : Promise.resolve(false),
  ])

  return (
    <DashboardClient
      defaultProduct={profileResult.data?.product_name ?? ''}
      isExhausted={exhausted}
    />
  )
}
