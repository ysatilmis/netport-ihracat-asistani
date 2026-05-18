import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/actions/auth'
import Link from 'next/link'
import { TokenMeter } from '@/components/token-meter'
import { AppNav } from '@/components/app-nav'
import { getUnresolvedSignalCount } from '@/actions/signals'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const signalCount = await getUnresolvedSignalCount().catch(() => 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <header
        className="border-b border-white/5"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <span className="text-white text-sm font-bold">N</span>
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                Netport AI
              </span>
            </Link>
            <AppNav signalCount={signalCount} />
          </div>
          <div className="flex items-center gap-3">
            <TokenMeter userId={user.id} />
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-white/70 hover:text-white transition-colors px-2 py-1"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
