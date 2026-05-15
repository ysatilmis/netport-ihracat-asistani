'use client'
import { Button } from '@/components/ui/button'
import type { CountryOption } from '@/lib/report-prompts'

interface CountryChooserProps {
  countries: CountryOption[]
  product: string
  onPick: (country: string) => void
  disabled?: boolean
}

export function CountryChooser({ countries, product, onPick, disabled }: CountryChooserProps) {
  return (
    <div className="my-6 p-5 rounded-2xl border-2 border-dashed"
      style={{ borderColor: 'var(--accent, #1e40af)', backgroundColor: '#f8fafc' }}>
      <div className="mb-4">
        <h3 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
          🎯 Hangi pazara odaklanalım?
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          AI <strong>{product}</strong> için 3 ülke önerdi. Birini seçince Faz 2-3-4 (10 bölüm) o ülkeye göre üretilecek.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {countries.map((c, idx) => (
          <div
            key={c.name}
            className="flex flex-col rounded-xl border bg-white p-4 hover:border-blue-400 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: idx === 0 ? '#dbeafe' : '#f1f5f9', color: idx === 0 ? '#1e40af' : '#64748b' }}>
                {idx === 0 ? '🥇 Birinci öncelik' : idx === 1 ? '🥈 İkinci' : '🥉 Üçüncü'}
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                {c.score}/10
              </span>
            </div>

            <div className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
              {c.name}
            </div>

            {c.customs_advantage && (
              <div className="text-xs mb-2 inline-block px-2 py-0.5 rounded-full self-start"
                style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>
                {c.customs_advantage}
              </div>
            )}

            <p className="text-xs leading-relaxed flex-1 mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {c.summary}
            </p>

            <Button
              onClick={() => onPick(c.name)}
              disabled={disabled}
              className="w-full text-sm text-white font-medium mt-auto"
              style={{ backgroundColor: idx === 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}
            >
              {c.name} ile devam et →
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
