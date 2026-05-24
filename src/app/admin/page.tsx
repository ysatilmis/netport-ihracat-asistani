import { getAdminDashboardKpis, getAdminRecentActivity } from '@/actions/admin'
import Link from 'next/link'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function AdminDashboardPage() {
  const kpis = await getAdminDashboardKpis()
  const activity = await getAdminRecentActivity()

  const cards = [
    { label: 'Toplam Kullanıcı', value: kpis.totalUsers, href: '/admin/users', color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { label: 'Toplam Rapor', value: kpis.totalReports, href: '/admin/reports', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { label: 'Full Rapor', value: kpis.fullReports, href: '/admin/reports', color: 'bg-violet-50 border-violet-200 text-violet-800' },
    { label: 'Premium Üye', value: kpis.premiumUsers, href: '/admin/users', color: 'bg-amber-50 border-amber-200 text-amber-800' },
    { label: 'Ödeme (₺)', value: kpis.totalRevenue.toLocaleString('tr-TR'), href: '/admin/payments', color: 'bg-green-50 border-green-200 text-green-800' },
    { label: 'Tahsilat', value: `${kpis.paymentCount} adet`, href: '/admin/payments', color: 'bg-sky-50 border-sky-200 text-sky-800' },
  ]

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent-strong)] font-bold mb-2">
          Admin · Dashboard
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Genel Bakış</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {cards.map(c => (
          <Link key={c.label} href={c.href} className={`block rounded-xl border p-4 ${c.color} hover:shadow-md transition-shadow`}>
            <div className="text-xs font-mono font-semibold uppercase tracking-wider opacity-70 mb-1">{c.label}</div>
            <div className="text-2xl font-bold">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Son Kayıt Olanlar</h2>
          <div className="space-y-2">
            {activity.recentUsers.length === 0 && <p className="text-sm text-slate-400">Henüz kayıt yok</p>}
            {activity.recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-900">{u.full_name ?? '—'}</div>
                  <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                </div>
                <div className="text-xs text-slate-400 font-mono">{formatDate(u.created_at)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Son Raporlar</h2>
          <div className="space-y-2">
            {activity.recentReports.length === 0 && <p className="text-sm text-slate-400">Henüz rapor yok</p>}
            {activity.recentReports.map(r => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-900">{r.users?.full_name ?? r.users?.email ?? '—'}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {r.input_json?.product ?? '—'}{r.input_json?.country ? ` → ${r.input_json.country}` : ''}
                  </div>
                </div>
                <Link href={`/pdf/${r.id}`} target="_blank" className="text-xs text-[var(--primary)] hover:underline font-mono">
                  PDF
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Son Ödemeler</h2>
          <div className="space-y-2">
            {activity.recentPayments.length === 0 && <p className="text-sm text-slate-400">Henüz ödeme yok</p>}
            {activity.recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-900">{p.conversation_id?.slice(0, 12)}…</div>
                  <div className="text-xs text-slate-500 font-mono">{p.pack_id} · {p.report_count} rapor</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                    p.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                    p.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>{p.status}</span>
                  <span className="text-sm font-semibold text-slate-900">₺{Number(p.price_try).toLocaleString('tr-TR')}</span>
                  <span className="text-xs text-slate-400 font-mono">{formatDate(p.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
