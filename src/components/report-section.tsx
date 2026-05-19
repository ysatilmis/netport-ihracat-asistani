import { Markdown } from '@/components/markdown'

const PHASE_META = {
  1: {
    color: 'var(--phase-1)',
    gradient: 'linear-gradient(90deg, var(--phase-1), #60A5FA)',
    badge: 'Araştırma',
    bg: 'var(--p1-bg)',
    line: 'var(--p1-line)',
    fg: 'var(--p1-fg)',
  },
  2: {
    color: 'var(--phase-2)',
    gradient: 'linear-gradient(90deg, var(--phase-2), #A7F3D0)',
    badge: 'Konumlandırma',
    bg: 'var(--p2-bg)',
    line: 'var(--p2-line)',
    fg: 'var(--p2-fg)',
  },
  3: {
    color: 'var(--phase-3)',
    gradient: 'linear-gradient(90deg, var(--phase-3), #FED7AA)',
    badge: 'İlk Temas',
    bg: 'var(--p3-bg)',
    line: 'var(--p3-line)',
    fg: 'var(--p3-fg)',
  },
  4: {
    color: 'var(--phase-4)',
    gradient: 'linear-gradient(90deg, var(--phase-4), #DDD6FE)',
    badge: 'Yönetim Özeti',
    bg: 'var(--p4-bg)',
    line: 'var(--p4-line)',
    fg: 'var(--p4-fg)',
  },
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
      className="scroll-mt-24 mb-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_8px_24px_rgba(16,24,40,0.06)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div
        className="h-1.5 w-full"
        style={{ background: meta.gradient }}
        aria-hidden
      />
      <div className="px-6 md:px-8 py-6 md:py-7">
        <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 m-0">
            {title}
          </h2>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-semibold rounded-full border shrink-0"
            style={{ backgroundColor: meta.bg, color: meta.fg, borderColor: meta.line }}
          >
            <span aria-hidden style={{ color: meta.color }}>●</span>
            <span>Faz {phase} · {meta.badge}</span>
          </span>
        </div>
        <div className="text-slate-800">
          <Markdown>{summary}</Markdown>
          {details && (
            <details className="mt-5 group">
              <summary
                className="cursor-pointer text-sm font-medium select-none inline-flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg border"
                style={{ backgroundColor: 'var(--p1-bg)', color: 'var(--p1-fg)', borderColor: 'var(--p1-line)' }}
              >
                <span className="inline-block transition-transform group-open:rotate-90 text-[10px]">▶</span>
                Detayları gör
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Markdown>{details}</Markdown>
              </div>
            </details>
          )}
          {isStreaming && <span className="animate-pulse ml-0.5 text-slate-400">▌</span>}
        </div>
      </div>
    </section>
  )
}
