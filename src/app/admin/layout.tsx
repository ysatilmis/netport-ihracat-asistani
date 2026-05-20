import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link href="/admin/users" className="flex items-center gap-2 group">
            <span className="font-bold tracking-tight">Netport</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-strong)] text-white">
              Admin
            </span>
          </Link>
          <nav className="flex gap-1 text-sm">
            <a
              href="/admin/users"
              className="px-3 py-1.5 rounded-md font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Kullanıcılar
            </a>
          </nav>
          <Link
            href="/dashboard"
            className="ml-auto text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            ← App
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
