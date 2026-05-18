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
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/results" className="hover:text-slate-900 transition-colors">
          Raporlarım
        </Link>
        <span>›</span>
        <Link href={`/results/${reportId}`} className="hover:text-slate-900 transition-colors">
          {product}{country ? ` — ${country}` : ''}
        </Link>
        <span>›</span>
        <span className="text-slate-900 font-medium">Alıcı Listesi</span>
      </nav>

      {/* Header */}
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          🎯 Alıcı Listesi
        </h1>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>
            <strong className="text-slate-900">{product}</strong>
            {country && (
              <>
                {' → '}
                <strong className="text-slate-900">{country}</strong>
              </>
            )}
          </span>
          <span className="text-slate-300">·</span>
          <span>Perplexity sonar-pro</span>
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
