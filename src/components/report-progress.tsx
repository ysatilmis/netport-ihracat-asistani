import { PHASE_META } from '@/lib/report-prompts'

const TOTAL_SECTIONS = 10

interface ReportProgressProps {
  completedSections: number
  currentSection?: string
  currentPhase?: number
}

export function ReportProgress({ completedSections, currentSection, currentPhase }: ReportProgressProps) {
  const percentage = Math.round((completedSections / TOTAL_SECTIONS) * 100)

  return (
    <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {completedSections < TOTAL_SECTIONS ? 'Rapor oluşturuluyor...' : '✅ Rapor tamamlandı'}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {completedSections} / {TOTAL_SECTIONS} bölüm
        </span>
      </div>

      <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'var(--muted)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: 'var(--primary)' }}
        />
      </div>

      <div className="flex gap-2 text-xs">
        {([1, 2, 3] as const).map((phase) => {
          const sectionEnd = phase === 1 ? 4 : phase === 2 ? 7 : 10
          const phaseDone = completedSections >= sectionEnd
          const phaseActive = currentPhase === phase && !phaseDone

          return (
            <div
              key={phase}
              className={`flex-1 px-2 py-1 rounded text-center transition-colors ${phaseDone ? 'font-medium' : ''}`}
              style={{
                backgroundColor: phaseDone ? 'var(--primary)' : phaseActive ? '#DBEAFE' : 'var(--muted)',
                color: phaseDone ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {phaseDone ? '✓ ' : phaseActive ? '⟳ ' : ''}{PHASE_META[phase].title}
            </div>
          )
        })}
      </div>

      {currentSection && completedSections < TOTAL_SECTIONS && (
        <p className="text-xs mt-2 italic" style={{ color: 'var(--muted-foreground)' }}>
          Şu an: {currentSection}
        </p>
      )}
    </div>
  )
}
