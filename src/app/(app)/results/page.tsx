import { getReports } from '@/actions/reports'
import Link from 'next/link'
import { ReportRowActions } from '@/components/report-row-actions'

export default async function ResultsPage() {
  const reports = await getReports()

  if (reports.length === 0) {
    return (
      <div className="max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
          02 — Reports
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">
          Raporlarım
        </h1>
        <p className="text-slate-600 mb-10">
          Burada üretip kaydettiğin ihracat analizleri listelenir.
        </p>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
          <div className="text-5xl mb-4" aria-hidden>📄</div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Henüz rapor yok
          </h2>
          <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
            Dashboard&apos;a gidip bir ürün adı yaz, AI sana 3 ülke önerip seçtiğin
            pazara özel 11 bölümlük analiz hazırlasın.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            🚀 İlk raporu üret
          </Link>
        </div>
      </div>
    )
  }

  const newThisMonth = reports.filter((r) => {
    const d = new Date(r.created_at)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
            02 — Reports · {reports.length} kayıt
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Raporlarım
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            {reports.length} rapor · {newThisMonth > 0 ? `Bu ay ${newThisMonth} yeni` : 'Bu ay yeni rapor yok'}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
          style={{ backgroundColor: 'var(--accent-strong)' }}
        >
          + Yeni rapor
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_120px_110px_60px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
          <span>Ürün / Pazar</span>
          <span>Durum</span>
          <span>Tarih</span>
          <span aria-hidden></span>
        </div>

        {reports.map((r) => {
          const product = r.input_json?.product ?? ''
          const country = r.input_json?.country ?? ''
          const title = product
            ? country
              ? `${product} → ${country}`
              : product
            : r.prompt_key.replace(/_/g, ' ')
          const preview = r.output_text
            .replace(/[#`*_>\-]/g, '')
            .replace(/\|[^\n]*\|/g, '')
            .replace(/\n+/g, ' ')
            .trim()
            .slice(0, 120)
          const dateStr = new Date(r.created_at).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          const isFull = r.is_full_report

          return (
            <div
              key={r.id}
              className="relative group border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
            >
              <ReportRowActions reportId={r.id} reportTitle={title} />
              <Link
                href={`/results/${r.id}`}
                className="grid grid-cols-1 sm:grid-cols-[1fr_120px_110px_60px] gap-2 sm:gap-4 px-5 py-4 pr-14 items-center"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug truncate group-hover:text-[var(--primary)] transition-colors">
                    {title}
                  </h3>
                  {preview && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-1 mt-0.5">
                      {preview}
                    </p>
                  )}
                </div>
                <div className="flex sm:block items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ${
                      isFull
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        isFull ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      aria-hidden
                    />
                    {isFull ? 'Tam rapor' : 'Tek bölüm'}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500 tabular-nums">{dateStr}</span>
                <span
                  className="hidden sm:block text-right text-slate-300 group-hover:text-slate-900 transition-colors"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
