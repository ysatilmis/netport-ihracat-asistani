import { getAllFeedback } from '@/actions/admin'

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-slate-400 font-mono text-xs">—</span>
  return (
    <span className="text-amber-400 tracking-tight">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AdminFeedbackPage() {
  const items = await getAllFeedback()

  const withRating = items.filter(f => f.rating !== null)
  const avg = withRating.length
    ? (withRating.reduce((s, f) => s + (f.rating ?? 0), 0) / withRating.length).toFixed(1)
    : null

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent-strong)] font-bold mb-2">
          Admin · Feedback
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Geri Bildirimler</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">
          {items.length} kayıt{avg ? ` · ortalama ${avg} puan` : ''}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {items.length === 0 ? (
          <p className="px-6 py-12 text-center text-slate-400 font-mono text-sm">Henüz geri bildirim yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left">Tarih</th>
                <th className="px-5 py-3 text-left">Puan</th>
                <th className="px-5 py-3 text-left">Mesaj</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors align-top">
                  <td className="px-5 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">{formatDate(f.created_at)}</td>
                  <td className="px-5 py-4 whitespace-nowrap"><Stars rating={f.rating} /></td>
                  <td className="px-5 py-4 text-slate-700 leading-relaxed">{f.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
