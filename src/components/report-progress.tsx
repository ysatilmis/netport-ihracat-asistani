import { PHASE_META, DEEP_DIVE_SECTIONS } from '@/lib/report-prompts'

const TOTAL_SECTIONS = DEEP_DIVE_SECTIONS.length

interface ReportProgressProps {
  completedSections: number
  currentSection?: string
  currentPhase?: number
}

const PHASE_VISUAL = {
  1: { emoji: '🔍', bg: 'var(--p1-bg)', line: 'var(--p1-line)', fg: 'var(--p1-fg)', color: 'var(--phase-1)' },
  2: { emoji: '🎯', bg: 'var(--p2-bg)', line: 'var(--p2-line)', fg: 'var(--p2-fg)', color: 'var(--phase-2)' },
  3: { emoji: '✉️', bg: 'var(--p3-bg)', line: 'var(--p3-line)', fg: 'var(--p3-fg)', color: 'var(--phase-3)' },
  4: { emoji: '📋', bg: 'var(--p4-bg)', line: 'var(--p4-line)', fg: 'var(--p4-fg)', color: 'var(--phase-4)' },
} as const

const PHASE_DESC = {
  1: 'Ülke, pazar, tüketici, yasal',
  2: 'USP, fiyat, içerik',
  3: 'Alıcı, e-posta, müzakere',
  4: 'Yönetici özeti + aksiyon',
} as const

export function ReportProgress({ completedSections, currentSection, currentPhase }: ReportProgressProps) {
  const percentage = Math.round((completedSections / TOTAL_SECTIONS) * 100)
  const isDone = completedSections >= TOTAL_SECTIONS

  return (
    <div className="mb-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm font-semibold text-slate-900">
          {isDone ? '✅ Rapor tamamlandı' : '⏳ Rapor oluşturuluyor...'}
        </span>
        <span className="text-sm font-mono text-slate-500 tabular-nums">
          {completedSections} / {TOTAL_SECTIONS} bölüm · {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-3">
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--primary))',
            }}
          />
        </div>
      </div>

      {/* 4 phase cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
        {([1, 2, 3, 4] as const).map((phase) => {
          const sectionEnd = phase === 1 ? 3 : phase === 2 ? 6 : phase === 3 ? 9 : 10
          const phaseDone = completedSections >= sectionEnd
          const phaseActive = currentPhase === phase && !phaseDone
          const visual = PHASE_VISUAL[phase]

          let cardStyle: React.CSSProperties = {}
          let statusEl = null
          if (phaseDone) {
            cardStyle = { backgroundColor: visual.bg, borderColor: visual.line }
            statusEl = (
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: visual.fg }}>
                ✓ Tamamlandı
              </span>
            )
          } else if (phaseActive) {
            cardStyle = { backgroundColor: '#FFFFFF', borderColor: visual.color, borderWidth: 2 }
            statusEl = (
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider inline-flex items-center gap-1" style={{ color: visual.color }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: visual.color }} />
                Aktif
              </span>
            )
          } else {
            cardStyle = { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', opacity: 0.65 }
          }

          const circleStyle: React.CSSProperties = phaseDone || phaseActive
            ? { backgroundColor: visual.color, color: '#FFFFFF' }
            : { backgroundColor: '#F1F5F9', color: '#64748B' }

          return (
            <div
              key={phase}
              className="rounded-xl border p-4 transition-all"
              style={cardStyle}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg font-mono font-bold text-sm mb-3" style={circleStyle}>
                {phaseDone ? '✓' : phase}
              </div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1 leading-tight">
                <span className="mr-1.5">{visual.emoji}</span>
                {PHASE_META[phase].title}
              </h4>
              <p className="text-sm text-slate-500 leading-snug mb-2">
                {PHASE_DESC[phase]}
              </p>
              {statusEl}
            </div>
          )
        })}
      </div>

      {currentSection && !isDone && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-600">
            <span className="font-mono text-slate-400 mr-2">▸</span>
            Şu an: <span className="font-medium text-slate-900">{currentSection}</span>
          </p>
        </div>
      )}
    </div>
  )
}
