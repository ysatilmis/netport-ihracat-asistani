import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/actions/auth'
import Link from 'next/link'
import Image from 'next/image'
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
            <Link
              href="/dashboard"
              className="group flex items-center bg-white rounded-lg shadow-sm transition-all hover:shadow-md hover:scale-[1.02] px-2.5 py-1"
              aria-label="Netport ana sayfa"
            >
              <Image
                src="/netport-logo.png"
                alt="Netport"
                width={120}
                height={32}
                priority
                className="h-7 w-auto"
              />
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold uppercase tracking-wider bg-[var(--accent)] text-white">
                AI
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
