'use client'
import { useState, useTransition } from 'react'
import { resolveSignal, type SignalRow } from '@/actions/signals'

interface SignalListProps {
  signals: SignalRow[]
}

const SIGNAL_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  tarife: { label: 'Tarife', color: 'bg-amber-100 text-amber-900 border-amber-200' },
  regulasyon: { label: 'Regülasyon', color: 'bg-rose-100 text-rose-900 border-rose-200' },
  pazar_payi: { label: 'Pazar Payı', color: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
  sta: { label: 'STA / GTS', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  rakip: { label: 'Rakip', color: 'bg-purple-100 text-purple-900 border-purple-200' },
  lojistik: { label: 'Lojistik', color: 'bg-sky-100 text-sky-900 border-sky-200' },
}

const SEVERITY_BARS: Record<number, string> = {
  1: '▁',
  2: '▃',
  3: '▅',
  4: '▇',
  5: '█',
}

export function SignalList({ signals }: SignalListProps) {
  const unresolved = signals.filter((s) => !s.is_resolved)
  if (unresolved.length === 0) return null

  return (
    <aside className="mb-8 p-5 rounded-2xl border border-rose-200 bg-rose-50">
      <header className="mb-4 flex items-center gap-2">
        <span className="text-xl" aria-hidden>🔔</span>
        <h2 className="text-base font-semibold text-rose-900">
          {unresolved.length} açık pazar sinyali
        </h2>
        <span className="text-xs text-rose-700/80 ml-2">
          Pazar Sinyali Ajanı son taramada değişim tespit etti.
        </span>
      </header>
      <ul className="space-y-2.5">
        {unresolved.map((s) => (
          <SignalRowItem key={s.id} signal={s} />
        ))}
      </ul>
    </aside>
  )
}

function SignalRowItem({ signal }: { signal: SignalRow }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [resolved, setResolved] = useState(false)
  const meta = SIGNAL_TYPE_LABEL[signal.signal_type] ?? {
    label: signal.signal_type,
    color: 'bg-slate-100 text-slate-900 border-slate-200',
  }

  if (resolved) return null

  const onResolve = () => {
    startTransition(async () => {
      await resolveSignal(signal.id)
      setResolved(true)
    })
  }

  const detected = new Date(signal.detected_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <li className="rounded-xl bg-white border border-rose-100 p-3">
      <div className="flex items-start gap-3">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.color} whitespace-nowrap`}
        >
          {meta.label}
        </span>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-left w-full text-sm font-medium text-slate-900 hover:text-rose-900"
          >
            {signal.summary}
          </button>
          {open && signal.detail && (
            <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {signal.detail}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
            <span title={`Önem: ${signal.severity}/5`}>
              {SEVERITY_BARS[signal.severity] ?? '·'} <span className="tabular-nums">{signal.severity}/5</span>
            </span>
            <span>·</span>
            <span>{detected}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onResolve}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
        >
          {isPending ? '…' : '✓ Kapat'}
        </button>
      </div>
    </li>
  )
}
