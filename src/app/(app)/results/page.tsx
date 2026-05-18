import { getReports } from '@/actions/reports'
import Link from 'next/link'

export default async function ResultsPage() {
  const reports = await getReports()

  if (reports.length === 0) {
    return (
      <div className="max-w-3xl">
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
            pazara özel 10 bölümlük analiz hazırlasın.
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

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Raporlarım
          </h1>
          <p className="text-slate-600 mt-1">
            {reports.length} rapor · son güncellenen en üstte
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium px-3 py-2 rounded-md text-white shadow-sm transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          + Yeni rapor
        </Link>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            .slice(0, 160)
          const dateStr = new Date(r.created_at).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
          const isFull = r.is_full_report

          return (
            <li key={r.id}>
              <Link
                href={`/results/${r.id}`}
                className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isFull
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isFull ? '📄 Tam Rapor' : 'Tek bölüm'}
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {dateStr}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-slate-600 leading-6 line-clamp-3">
                  {preview || '—'}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
