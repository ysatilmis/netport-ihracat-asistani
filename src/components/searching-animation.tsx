'use client'
import { useState, useEffect } from 'react'

const STEPS = [
  { emoji: '🔍', label: 'Perplexity ile küresel pazar veritabanı taranıyor...' },
  { emoji: '📊', label: 'İthalat hacimleri ve Türkiye\'nin payı hesaplanıyor...' },
  { emoji: '🏛️', label: 'Gümrük anlaşmaları ve tarife avantajları kontrol ediliyor...' },
  { emoji: '📈', label: 'Büyüme trendleri ve lojistik veriler analiz ediliyor...' },
  { emoji: '🎯', label: 'En uygun 3 hedef pazar karşılaştırılıyor...' },
]

export function SearchingAnimation() {
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stepTimer = setInterval(() => setCurrent(s => (s + 1) % STEPS.length), 4000)
    const progTimer = setInterval(() => setProgress(p => Math.min(p + 1, 88)), 350)
    return () => { clearInterval(stepTimer); clearInterval(progTimer) }
  }, [])

  return (
    <div className="mb-6 p-5 rounded-2xl border" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: 'var(--primary)', animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
          Pazar araştırması yapılıyor
        </span>
        <span className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)' }}>
          ~15-20 sn
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full mb-4" style={{ backgroundColor: '#e0f2fe' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: 'var(--primary)' }}
        />
      </div>

      {/* Active step */}
      <div className="flex items-center gap-3 p-3 rounded-xl mb-3 bg-white">
        <span className="text-xl">{STEPS[current].emoji}</span>
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {STEPS[current].label}
        </span>
      </div>

      {/* Step list */}
      <div className="space-y-1.5">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs transition-all duration-300"
            style={{
              color: i === current ? 'var(--primary)' : 'var(--muted-foreground)',
              opacity: i < current ? 0.45 : i === current ? 1 : 0.3,
            }}
          >
            <span className="w-3 text-center">{i < current ? '✓' : i === current ? '⟳' : '○'}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
