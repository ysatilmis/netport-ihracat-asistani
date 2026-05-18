'use client'
import { Button } from '@/components/ui/button'
import type { CountryOption } from '@/lib/report-prompts'

interface CountryChooserProps {
  countries: CountryOption[]
  product: string
  onPick: (country: string) => void
  disabled?: boolean
}

const RANK_META = [
  { emoji: '🥇', label: 'Birinci öncelik', badgeBg: '#DBEAFE', badgeFg: '#1E40AF' },
  { emoji: '🥈', label: 'İkinci', badgeBg: '#F1F5F9', badgeFg: '#475569' },
  { emoji: '🥉', label: 'Üçüncü', badgeBg: '#FEF3C7', badgeFg: '#78350F' },
] as const

export function CountryChooser({ countries, product, onPick, disabled }: CountryChooserProps) {
  return (
    <section className="my-8">
      <header className="mb-5">
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
          🎯 Hangi pazara odaklanalım?
        </h3>
        <p className="text-sm mt-1.5 text-slate-600">
          AI <strong className="text-slate-900">{product}</strong> için 3 ülke önerdi. Birini
          seçince 10 bölümlük zincirleme analiz o ülkeye özel akacak.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {countries.map((c, idx) => {
          const rank = RANK_META[idx] ?? RANK_META[2]
          const score = Math.max(0, Math.min(10, Number(c.score) || 0))
          const scorePct = (score / 10) * 100
          const isPrimary = idx === 0

          return (
            <article
              key={c.name}
              className={`group flex flex-col rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isPrimary
                  ? 'border-slate-300 ring-1 ring-slate-200'
                  : 'border-slate-200'
              }`}
            >
              {/* Rank + score */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full inline-flex items-center gap-1"
                  style={{ backgroundColor: rank.badgeBg, color: rank.badgeFg }}
                >
                  <span aria-hidden>{rank.emoji}</span>
                  {rank.label}
                </span>
                <span className="text-sm font-semibold text-slate-700 tabular-nums">
                  {score}
                  <span className="text-slate-400 text-xs">/10</span>
                </span>
              </div>

              {/* Country name */}
              <h4 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                {c.name}
              </h4>

              {/* Score bar */}
              <div className="mb-3" aria-label={`Skor ${score} / 10`}>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${scorePct}%`,
                      backgroundColor: isPrimary ? 'var(--primary)' : '#64748B',
                    }}
                  />
                </div>
              </div>

              {/* Customs badge */}
              {c.customs_advantage && (
                <div className="mb-3">
                  <span
                    className="text-[11px] font-medium inline-block px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100"
                  >
                    🛃 {c.customs_advantage}
                  </span>
                </div>
              )}

              {/* Summary */}
              <p className="text-sm leading-relaxed flex-1 mb-4 text-slate-600">
                {c.summary}
              </p>

              <Button
                onClick={() => onPick(c.name)}
                disabled={disabled}
                className={`w-full text-sm font-medium ${
                  isPrimary
                    ? 'text-white shadow-sm'
                    : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50'
                }`}
                style={
                  isPrimary
                    ? { backgroundColor: 'var(--primary)' }
                    : undefined
                }
                variant={isPrimary ? 'default' : 'outline'}
              >
                {c.name} ile devam et →
              </Button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
