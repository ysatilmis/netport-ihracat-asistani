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
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2.5 bg-white rounded-xl shadow-sm transition-all hover:shadow-md hover:scale-[1.02] px-4 py-2"
              aria-label="Netport ana sayfa"
            >
              <Image
                src="/netport-logo.png"
                alt="Netport"
                width={400}
                height={400}
                priority
                className="h-14 w-14 object-contain"
              />
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-[var(--accent)] text-white shadow-sm">
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
