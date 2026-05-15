import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ReportSection } from '@/components/report-section'
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

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/results">
          <Button variant="ghost" size="sm">← Geri</Button>
        </Link>
        <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
          {isFullReport ? '📄 Tam İhracat Raporu' : `Aşama ${report.phase} — ${report.prompt_key.replace(/_/g, ' ')}`}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {new Date(report.created_at).toLocaleDateString('tr-TR')}
        </span>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {Object.entries(inputs).map(([k, v]) =>
          v ? (
            <span key={k} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
              {k}: {v}
            </span>
          ) : null
        )}
      </div>

      {isFullReport ? (
        REPORT_SECTIONS.map((section) => {
          const data = report.report_sections![section.key]
          if (!data) return null
          return (
            <ReportSection
              key={section.key}
              title={section.title}
              text={data.text}
              phase={section.phase}
            />
          )
        })
      ) : (
        <div
          className="bg-white border rounded-xl p-6 leading-relaxed text-sm whitespace-pre-wrap"
          style={{ borderColor: 'var(--border)' }}
        >
          {report.output_text}
        </div>
      )}
    </div>
  )
}
