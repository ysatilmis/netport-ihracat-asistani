import { Badge } from '@/components/ui/badge'
import { Markdown } from '@/components/markdown'

const PHASE_META = {
  1: { color: 'var(--phase-1)', badge: 'Araştırma' },
  2: { color: 'var(--phase-2)', badge: 'Konumlandırma' },
  3: { color: 'var(--phase-3)', badge: 'İlk Temas' },
  4: { color: 'var(--phase-4)', badge: 'Yönetim Özeti' },
} as const

interface ReportSectionProps {
  id?: string
  title: string
  text: string
  phase: 1 | 2 | 3 | 4
  isStreaming?: boolean
}

function splitSummaryAndDetails(text: string): { summary: string; details: string } {
  const detailsMatch = text.match(/^##\s+Detaylar\s*$/m)
  if (!detailsMatch || detailsMatch.index === undefined) {
    // Eski format: tüm text summary'de göster (backward compat)
    return { summary: text, details: '' }
  }
  const splitIdx = detailsMatch.index
  const summary = text.slice(0, splitIdx).replace(/^##\s+Yönetici Özeti\s*\n?/m, '').trim()
  const details = text.slice(splitIdx + detailsMatch[0].length).trim()
  return { summary, details }
}

export function ReportSection({ id, title, text, phase, isStreaming }: ReportSectionProps) {
  const meta = PHASE_META[phase]
  const { summary, details } = splitSummaryAndDetails(text)

  return (
    <section
      id={id}
      className="scroll-mt-24 mb-10 border-l-[3px] pl-5 md:pl-6 py-1"
      style={{ borderColor: meta.color }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <Badge
          variant="outline"
          className="text-[10px] uppercase tracking-wider font-semibold shrink-0"
          style={{ color: meta.color, borderColor: meta.color }}
        >
          {meta.badge}
        </Badge>
      </div>
      <div className="text-slate-800">
        <Markdown>{summary}</Markdown>
        {details && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 select-none">
              Detayları gör ▼
            </summary>
            <div className="mt-3">
              <Markdown>{details}</Markdown>
            </div>
          </details>
        )}
        {isStreaming && <span className="animate-pulse ml-0.5 text-slate-400">▌</span>}
      </div>
    </section>
  )
}
