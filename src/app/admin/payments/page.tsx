import { getAllPayments } from '@/actions/admin'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function AdminPaymentsPage() {
  const payments = await getAllPayments()

  const completedPayments = payments.filter(p => p.status === 'completed')
  const totalRevenue = completedPayments.reduce((s, p) => s + Number(p.price_try), 0)

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent-strong)] font-bold mb-2">
          Admin · Payments
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ödemeler</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">
          {payments.length} kayıt · {completedPayments.length} başarılı · toplam ₺{totalRevenue.toLocaleString('tr-TR')}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left">Tarih</th>
                <th className="px-5 py-3 text-left">Kullanıcı</th>
                <th className="px-5 py-3 text-left">Paket</th>
                <th className="px-5 py-3 text-left">Rapor</th>
                <th className="px-5 py-3 text-left">Tutar</th>
                <th className="px-5 py-3 text-left">Durum</th>
                <th className="px-5 py-3 text-left">Referans</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4 text-slate-700 font-mono text-xs">{formatDate(p.created_at)}</td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-slate-500">{p.user_id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-700 text-xs">{p.pack_id}</td>
                  <td className="px-5 py-4 font-mono text-slate-700">{p.report_count}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900 font-mono">₺{Number(p.price_try).toLocaleString('tr-TR')}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
                      p.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      p.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[10px] text-slate-400">{p.iyzico_payment_id ?? p.conversation_id?.slice(0, 16) ?? '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
