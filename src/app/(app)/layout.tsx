import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/actions/auth'
import Link from 'next/link'
import { TokenMeter } from '@/components/token-meter'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <header style={{ backgroundColor: 'var(--primary)' }} className="px-6 py-0 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                <span className="text-white text-sm font-bold">N</span>
              </div>
              <span className="font-bold text-white text-base tracking-tight">Netport AI</span>
            </div>
            <nav className="flex gap-6 text-sm">
              <Link href="/dashboard" className="text-blue-200 hover:text-white transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/results" className="text-blue-200 hover:text-white transition-colors font-medium">
                Raporlarım
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <TokenMeter userId={user.id} />
            <form action={signOut}>
              <button type="submit" className="text-sm text-blue-200 hover:text-white transition-colors">
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
