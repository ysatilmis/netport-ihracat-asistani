import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/actions/auth'
import Link from 'next/link'
import Image from 'next/image'
import { TokenMeter } from '@/components/token-meter'
import { AppNav } from '@/components/app-nav'
import { getUnresolvedSignalCount } from '@/actions/signals'
import AppMobileNav from '@/components/app-mobile-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const signalCount = await getUnresolvedSignalCount().catch(() => 0)

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-20 px-4 sm:px-6">
          <div className="flex items-center gap-3 md:gap-6">
            <Link
              href="/dashboard"
              className="group flex items-center transition-transform hover:scale-[1.02]"
              aria-label="Netport ana sayfa"
            >
              <Image
                src="/netport-logo.png"
                alt="Netport"
                width={400}
                height={400}
                unoptimized
                priority
                className="h-12 md:h-16 w-auto object-contain"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-strong)] text-white shadow-sm">
              AI
            </span>
            <div className="hidden lg:block">
              <AppNav signalCount={signalCount} />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <TokenMeter userId={user.id} />
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:shadow-sm active:scale-95 px-3 py-2 rounded-lg"
              >
                Çıkış
              </button>
            </form>
            <div className="lg:hidden">
              <AppMobileNav signalCount={signalCount} />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 w-full">
        {children}
      </main>
    </div>
  )
}
