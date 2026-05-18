import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ReportSection } from '@/components/report-section'
import { Markdown } from '@/components/markdown'
import { ReportToc, type TocItem } from '@/components/report-toc'
import { ReportActions } from '@/components/report-actions'
import { SignalList } from '@/components/signal-list'
import { QualityPanel } from '@/components/quality-panel'
import { LeadsPanel } from '@/components/leads-panel'
import { getSignalsForReport } from '@/actions/signals'
import { getQualityCheck } from '@/actions/quality'
import { getLeads } from '@/actions/leads'
import { REPORT_SECTIONS } from '@/lib/report-prompts'

type ReportSectionData = { title: string; text: string; phase: number }

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single() as {
      data: {
        id: string
        phase: number
        prompt_key: string
        input_json: Record<string, string>
        output_text: string
        report_sections: Record<string, ReportSectionData> | null
        is_full_report: boolean
        created_at: string
      } | null
      error: unknown
    }

  if (!report) notFound()

  const inputs = report.input_json
  const isFullReport = report.is_full_report && report.report_sections
  const product = inputs.product || inputs.country || 'Rapor'
  const country = inputs.country || ''
  const dateStr = new Date(report.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const tocItems: TocItem[] = isFullReport
    ? REPORT_SECTIONS
        .filter((s) => report.report_sections![s.key])
        .map((s) => ({
          id: s.key,
          title: s.title,
          phase: s.phase as 1 | 2 | 3 | 4,
        }))
    : []

  const fullMarkdown = isFullReport
    ? `# ${product}${country ? ` — ${country}` : ''}\n\n` +
      `Tarih: ${dateStr}\n\n---\n\n` +
      REPORT_SECTIONS
        .filter((s) => report.report_sections![s.key])
        .map((s) => `## ${s.title}\n\n${report.report_sections![s.key].text}`)
        .join('\n\n---\n\n')
    : report.output_text

  return (
    <div className="max-w-7xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/results" className="hover:text-slate-900 transition-colors">
          Raporlarım
        </Link>
        <span>›</span>
        <span className="text-slate-900 font-medium">
          {product}
          {country && ` — ${country}`}
        </span>
      </nav>

      {/* Header */}
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">
          {product}
        </h1>
        <div className="flex items-center gap-3 flex-wrap text-sm text-slate-600">
          {country && (
            <span>
              Hedef pazar: <strong className="text-slate-900">{country}</strong>
            </span>
          )}
          <span className="text-slate-300">·</span>
          <span>{dateStr}</span>
          {isFullReport && (
            <>
              <span className="text-slate-300">·</span>
              <span>{Object.keys(report.report_sections!).length} bölüm</span>
            </>
          )}
        </div>
        {isFullReport && country && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/positioning/${report.id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              🎯 Faz B&apos;ye geç — Konumlandırma paketini üret
            </Link>
            <Link
              href={`/leads/${report.id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-transform hover:-translate-y-0.5"
            >
              🎯 Alıcı Bul
            </Link>
          </div>
        )}
      </header>

      {/* Pazar Sinyali Ajanı uyarıları */}
      <SignalList signals={await getSignalsForReport(report.id)} />

      {/* Kalite Kontrol Ajanı paneli */}
      {isFullReport && (
        <QualityPanel reportId={report.id} initial={await getQualityCheck(report.id)} />
      )}

      {/* Lead Bul Ajanı paneli */}
      {isFullReport && (
        <LeadsPanel
          reportId={report.id}
          initial={await getLeads(report.id)}
          product={product}
          country={country}
        />
      )}

      {isFullReport ? (
        <>
          {/* Executive Summary — highlighted card, üstte sabit */}
          {(() => {
            const execSection = REPORT_SECTIONS.find(s => s.key === 'executive_summary')
            const execData = report.report_sections!['executive_summary']
            if (!execSection || !execData) return null
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-3">Yönetici Özeti</h2>
                <ReportSection
                  id="executive_summary_top"
                  title=""
                  text={execData.text}
                  phase={execSection.phase as 1 | 2 | 3 | 4}
                />
              </div>
            )
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-x-10 gap-y-2">
            {/* TOC */}
            <aside className="lg:py-2">
              <ReportToc items={tocItems} />
            </aside>

            {/* Content */}
            <article className="min-w-0">
              {REPORT_SECTIONS.filter(s => s.key !== 'executive_summary').map((section) => {
                const data = report.report_sections![section.key]
                if (!data) return null
                return (
                  <ReportSection
                    key={section.key}
                    id={section.key}
                    title={section.title}
                    text={data.text}
                    phase={section.phase as 1 | 2 | 3 | 4}
                  />
                )
              })}

              {/* executive_summary — loop içinde de göster (TOC anchor için) */}
              {(() => {
                const execSection = REPORT_SECTIONS.find(s => s.key === 'executive_summary')
                const execData = report.report_sections!['executive_summary']
                if (!execSection || !execData) return null
                return (
                  <ReportSection
                    key="executive_summary"
                    id="executive_summary"
                    title={execSection.title}
                    text={execData.text}
                    phase={execSection.phase as 1 | 2 | 3 | 4}
                  />
                )
              })()}
            </article>
          </div>

          {/* Ek Analizler */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-base font-semibold text-slate-700 mb-3">Ek Analizler</h3>
            <div className="flex gap-3 flex-wrap">
              <a href={`/leads/${report.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50">
                🎯 B2B Alıcı Listesi Hazırla
              </a>
              <a href={`/positioning/${report.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50">
                🎯 Positioning Paketi Hazırla
              </a>
            </div>
          </div>
        </>
      ) : (
        <article className="max-w-3xl">
          <Markdown>{report.output_text}</Markdown>
        </article>
      )}

      {/* Action bar — sticky bottom, alttaki içeriği gölgelememesi için yeterli scroll padding */}
      <div className="h-24" aria-hidden />
      <ReportActions reportId={report.id} fullMarkdown={fullMarkdown} />
    </div>
  )
}
