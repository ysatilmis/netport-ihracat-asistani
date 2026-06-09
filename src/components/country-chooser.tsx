'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [showCustom, setShowCustom] = useState(false)
  const [customCountry, setCustomCountry] = useState('')

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = customCountry.trim()
    if (!trimmed) return
    onPick(trimmed)
  }

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

          const ribbonGradient = isPrimary
            ? 'linear-gradient(90deg, var(--accent) 0%, var(--primary) 100%)'
            : 'linear-gradient(90deg, var(--phase-1), #60A5FA)'

          return (
            <article
              key={c.name}
              className={`group relative flex flex-col rounded-2xl border bg-white p-6 pt-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] overflow-hidden ${
                isPrimary
                  ? 'border-[var(--accent)]/40 ring-2 ring-[var(--accent)]/15 shadow-[0_4px_24px_rgba(232,86,10,0.08)]'
                  : 'border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
              }`}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ background: ribbonGradient }}
                aria-hidden
              />
              {/* Rank + score */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                  style={{ backgroundColor: rank.badgeBg, color: rank.badgeFg }}
                >
                  <span aria-hidden className="text-base">{rank.emoji}</span>
                  {rank.label}
                </span>
                <span className="text-sm font-semibold text-slate-700 tabular-nums font-mono">
                  {score}
                  <span className="text-slate-400 text-xs">/10</span>
                </span>
              </div>

              {/* Country name */}
              <h4 className="text-2xl font-bold text-slate-900 mb-3 leading-tight tracking-tight">
                {c.name}
              </h4>

              {/* Score bar */}
              <div className="mb-4" aria-label={`Skor ${score} / 10`}>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${scorePct}%`,
                      background: isPrimary
                        ? 'linear-gradient(90deg, var(--accent), var(--primary))'
                        : 'linear-gradient(90deg, #94A3B8, #64748B)',
                      boxShadow: isPrimary ? 'inset 0 0 4px rgba(255,255,255,0.3)' : undefined,
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

      {/* 4. ülke seçeneği */}
      <div className="mt-6">
        <hr className="border-slate-200 mb-5" />
        {!showCustom ? (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            disabled={disabled}
            className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors disabled:opacity-40"
          >
            Başka bir ülke için analiz yap →
          </button>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-700 mb-1">Kendiniz bir ülke belirleyin</p>
            <p className="text-xs text-amber-600 mb-3">
              ⚠ AI bu ülkeyi önermediydi — rapor seçtiğiniz ülke için üretilecek.
            </p>
            <form onSubmit={handleCustomSubmit} className="flex flex-wrap sm:flex-nowrap gap-2 items-start">
              <Input
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                placeholder="örn: Güney Kore, Japonya, Brezilya"
                disabled={disabled}
                autoFocus
                className="flex-1 rounded-xl border-2 border-slate-200 focus:border-[var(--accent)] text-sm"
              />
              <Button
                type="submit"
                disabled={disabled || !customCountry.trim()}
                className="text-white text-sm font-medium rounded-xl shrink-0"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Analiz et
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowCustom(false); setCustomCountry('') }}
                disabled={disabled}
                className="text-slate-500 text-sm rounded-xl shrink-0"
              >
                İptal
              </Button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
