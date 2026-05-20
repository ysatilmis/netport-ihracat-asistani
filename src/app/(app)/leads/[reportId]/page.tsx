import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLeads } from '@/actions/leads'
import { LeadsPanel } from '@/components/leads-panel'

export default async function LeadsPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('reports')
    .select('id, input_json, is_full_report, created_at')
    .eq('id', reportId)
    .single() as {
      data: {
        id: string
        input_json: Record<string, string>
        is_full_report: boolean
        created_at: string
      } | null
      error: unknown
    }

  if (!report) notFound()

  const product = report.input_json?.product ?? 'Ürün'
  const country = report.input_json?.country ?? ''
  const initial = await getLeads(reportId)

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400"
        aria-label="Breadcrumb"
      >
        <Link href="/results" className="hover:text-slate-700 transition-colors">
          Raporlarım
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/results/${reportId}`}
          className="hover:text-slate-700 transition-colors truncate max-w-[16rem]"
        >
          {product}{country ? ` → ${country}` : ''}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-slate-900 font-semibold">Alıcı Listesi</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] mb-2">
          Faz 3 · Alıcı Eşleştirme
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-3">
          Alıcı Listesi
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)]" aria-hidden />
            {product}
            {country && (
              <>
                <span className="text-slate-400 mx-0.5">→</span>
                {country}
              </>
            )}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500">
            Perplexity sonar-pro
          </span>
        </div>
      </header>

      <LeadsPanel
        reportId={reportId}
        initial={initial}
        product={product}
        country={country}
      />
    </div>
  )
}
