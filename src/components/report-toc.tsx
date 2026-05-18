'use client'
import { useEffect, useState } from 'react'

export interface TocItem {
  id: string
  title: string
  phase: 1 | 2 | 3 | 4
}

const PHASE_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Araştırma',
  2: 'Konumlandırma',
  3: 'İlk Temas',
  4: 'Yönetim Özeti',
}

const PHASE_COLOR: Record<1 | 2 | 3 | 4, string> = {
  1: 'var(--phase-1)',
  2: 'var(--phase-2)',
  3: 'var(--phase-3)',
  4: 'var(--phase-4)',
}

interface ReportTocProps {
  items: TocItem[]
}

export function ReportToc({ items }: ReportTocProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (items.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )
    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [items])

  const grouped = items.reduce<Record<number, TocItem[]>>((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = []
    acc[item.phase].push(item)
    return acc
  }, {})
  const phaseKeys = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b) as Array<1 | 2 | 3 | 4>

  return (
    <>
      {/* Mobile collapse trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="lg:hidden w-full mb-4 flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <span>📑 İçindekiler</span>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>

      <nav
        className={`${open ? 'block' : 'hidden'} lg:block lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto text-sm mb-6 lg:mb-0`}
        aria-label="Rapor içindekiler"
      >
        <div className="hidden lg:block text-[10px] uppercase tracking-wider text-slate-500 mb-3 font-semibold">
          İçindekiler
        </div>
        {phaseKeys.map((phase) => (
          <div key={phase} className="mb-4">
            <div
              className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: PHASE_COLOR[phase] }}
            >
              {PHASE_LABELS[phase]}
            </div>
            <ul className="space-y-0.5 border-l border-slate-200">
              {grouped[phase].map((item) => {
                const isActive = activeId === item.id
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={() => setOpen(false)}
                      className={`block py-1 pl-3 -ml-px border-l-2 transition-colors ${
                        isActive
                          ? 'border-current text-slate-900 font-medium'
                          : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                      }`}
                      style={isActive ? { color: PHASE_COLOR[phase], borderColor: PHASE_COLOR[phase] } : undefined}
                    >
                      {item.title}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  )
}
