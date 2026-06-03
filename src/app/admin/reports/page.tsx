import { getAllReports } from '@/actions/admin'
import { DeleteReportButton } from './delete-report-button'
import type { Database } from '@/lib/supabase/types'

type ReportWithUser = Database['public']['Tables']['reports']['Row'] & {
  users: Pick<Database['public']['Tables']['users']['Row'], 'full_name' | 'email'> | null
}

function getProductCountry(report: ReportWithUser): { product: string; country: string } {
  const json = report.input_json as Record<string, string> | null
  return {
    product: json?.product ?? json?.urun ?? json?.ürün ?? '-',
    country: json?.country ?? json?.ulke ?? json?.ülke ?? json?.hedef_ulke ?? '-',
  }
}

export default async function AdminReportsPage() {
  const reports = await getAllReports()

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent-strong)] font-bold mb-2">
          Admin · Reports
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tüm Raporlar
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">
          {reports.length} rapor
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Desktop tablo */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left w-10">#</th>
                <th className="px-5 py-3 text-left">Kullanıcı</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Ürün</th>
                <th className="px-5 py-3 text-left">Ülke</th>
                <th className="px-5 py-3 text-left">Tarih</th>
                <th className="px-5 py-3 text-left w-40">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-mono text-sm">
                    Henüz hiç rapor yok.
                  </td>
                </tr>
              )}
              {reports.map((report, i) => (
                <ReportRow key={report.id} report={report} index={i} />
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobil kart listesi */}
        <div className="md:hidden divide-y divide-slate-100">
          {reports.length === 0 && (
            <p className="px-4 py-12 text-center text-slate-400 font-mono text-sm">Henüz hiç rapor yok.</p>
          )}
          {reports.map((report, i) => {
            const { product, country } = getProductCountry(report)
            const date = new Date(report.created_at).toLocaleDateString('tr-TR')
            return (
              <div key={report.id} className="px-4 py-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-400 font-mono">#{i + 1} · {report.users?.full_name ?? '?'}</div>
                    <div className="text-xs text-slate-500 font-mono truncate max-w-[180px]">{report.users?.email ?? '?'}</div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{date}</span>
                </div>
                <div className="text-sm font-medium text-slate-800 truncate">{product} → {country}</div>
                <div className="flex gap-2 pt-1">
                  <a href={`/pdf/${report.id}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                    PDF
                  </a>
                  <DeleteReportButton reportId={report.id} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ReportRow({ report, index }: { report: ReportWithUser; index: number }) {
  const { product, country } = getProductCountry(report)
  const date = new Date(report.created_at).toLocaleDateString('tr-TR')

  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
      <td className="px-5 py-4 text-slate-400 font-mono text-xs">{index + 1}</td>
      <td className="px-5 py-4">
        <div className="font-semibold text-slate-900 text-sm">
          {report.users?.full_name ?? '?'}
        </div>
      </td>
      <td className="px-5 py-4 text-slate-600 font-mono text-xs">
        {report.users?.email ?? '?'}
      </td>
      <td className="px-5 py-4 text-slate-700 text-sm max-w-[180px] truncate" title={product}>
        {product}
      </td>
      <td className="px-5 py-4 text-slate-700 text-sm">{country}</td>
      <td className="px-5 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">{date}</td>
      <td className="px-5 py-4">
        <div className="flex gap-2">
          <a
            href={`/pdf/${report.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </a>
          <DeleteReportButton reportId={report.id} />
        </div>
      </td>
    </tr>
  )
}
