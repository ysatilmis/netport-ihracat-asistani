export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center gap-4">
        <span className="font-bold">Netport Admin</span>
        <nav className="flex gap-4 text-sm text-slate-300">
          <a href="/admin/users" className="hover:text-white">Kullanıcılar</a>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
