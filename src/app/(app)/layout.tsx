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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-slate-900">Netport AI İhracat Asistanı</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
            <Link href="/results" className="text-slate-600 hover:text-slate-900">Raporlarım</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <TokenMeter userId={user.id} />
          <form action={signOut}>
            <button type="submit" className="text-sm text-slate-500 hover:text-slate-900">Çıkış</button>
          </form>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
