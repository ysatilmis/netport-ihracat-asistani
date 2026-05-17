'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { QualityCheckRow, QualityFlagRow } from '@/actions/quality'

interface Props {
  reportId: string
  initial: QualityCheckRow | null
}

const FLAG_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  kanitsiz_iddia: { label: 'Kanıtsız iddia', color: 'bg-rose-50 text-rose-900 border-rose-200' },
  celiski: { label: 'Çelişki', color: 'bg-amber-50 text-amber-900 border-amber-200' },
  belirsiz_veri: { label: 'Belirsiz veri', color: 'bg-yellow-50 text-yellow-900 border-yellow-200' },
  eksik_kaynak: { label: 'Eksik kaynak', color: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  eski_veri: { label: 'Eski veri', color: 'bg-slate-100 text-slate-900 border-slate-200' },
  jenerik_dolgu: { label: 'Jenerik dolgu', color: 'bg-purple-50 text-purple-900 border-purple-200' },
}

function scoreColor(score: number) {
  if (score >= 8.5) return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', ring: 'ring-emerald-200' }
  if (score >= 7) return { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', ring: 'ring-sky-200' }
  if (score >= 5) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', ring: 'ring-amber-200' }
  return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', ring: 'ring-rose-200' }
}

export function QualityPanel({ reportId, initial }: Props) {
  const [check, setCheck] = useState<QualityCheckRow | null>(initial)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const run = () => {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/quality-check/${reportId}`, { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? `HTTP ${res.status}`)
        return
      }
      router.refresh()
      // optimistic local update
      const j = (await res.json().catch(() => null)) as {
        ok: boolean
        overallScore?: number
        summary?: string
        flagCount?: number
        tokensUsed?: number
      } | null
      if (j?.ok) {
        // refetch via router.refresh — local state'i tetiklemiyor, küçük placeholder
        setCheck((c) => c ?? null)
      }
    })
  }

  if (!check && !isPending) {
    return (
      <aside className="mb-6 p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <div className="font-semibold text-slate-900">🛡️ Kalite Kontrol</div>
          <p className="text-slate-600">
            Bu raporu Claude Haiku 4.5 ile denetle — kanıtsız iddia, çelişki, belirsiz veri tespiti.
          </p>
        </div>
        <button
          onClick={run}
          disabled={isPending}
          className="text-sm px-3 py-1.5 rounded-md font-medium text-white shadow-sm disabled:opacity-60"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Kalite raporu üret
        </button>
        {error && <p className="text-xs text-rose-700 w-full">{error}</p>}
      </aside>
    )
  }

  if (isPending && !check) {
    return (
      <aside className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-900 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Kalite kontrol çalışıyor — ~10-30 saniye.
      </aside>
    )
  }

  if (!check) return null

  if (check.status === 'failed') {
    return (
      <aside className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-900 flex items-center justify-between">
        <span>❌ Kalite kontrol başarısız: {check.error_message ?? 'bilinmeyen hata'}</span>
        <button
          onClick={run}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded-md border border-rose-300 bg-white text-rose-700 hover:bg-rose-100"
        >
          Yeniden dene
        </button>
      </aside>
    )
  }

  if (check.status === 'running' || isPending) {
    return (
      <aside className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-900 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Kalite kontrol çalışıyor…
      </aside>
    )
  }

  // status=done
  const colors = scoreColor(check.overall_score)
  const flags = (check.flags_json ?? []) as QualityFlagRow[]
  const sorted = [...flags].sort((a, b) => b.severity - a.severity)

  return (
    <aside className={`mb-6 p-5 rounded-2xl border ${colors.bg} ${colors.border}`}>
      <header className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-full bg-white ring-4 ${colors.ring}`}
          >
            <div className="text-center">
              <div className={`text-xl font-bold tabular-nums leading-none ${colors.text}`}>
                {check.overall_score.toFixed(1)}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">/ 10</div>
            </div>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              🛡️ Kalite Kontrol
              <span className="text-xs font-normal text-slate-500">
                {flags.length} flag · Haiku denetim
              </span>
            </h2>
            <p className="text-sm text-slate-700 mt-0.5 max-w-xl">{check.summary}</p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={isPending}
          className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          ↻ Yeniden çalıştır
        </button>
      </header>

      {sorted.length > 0 && (
        <ul className="space-y-2 mt-4">
          {sorted.map((f, i) => {
            const meta = FLAG_TYPE_LABEL[f.type] ?? {
              label: f.type,
              color: 'bg-slate-100 text-slate-900 border-slate-200',
            }
            return (
              <FlagItem key={i} flag={f} meta={meta} />
            )
          })}
        </ul>
      )}

      {sorted.length === 0 && (
        <p className="text-sm text-emerald-800 mt-3">
          ✓ Bu raporda işaretlenecek bir kalite sorunu bulunamadı.
        </p>
      )}

      {error && <p className="text-xs text-rose-700 mt-3">{error}</p>}
    </aside>
  )
}

function FlagItem({ flag, meta }: { flag: QualityFlagRow; meta: { label: string; color: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-xl bg-white border border-slate-200 p-3">
      <div className="flex items-start gap-3">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${meta.color}`}
        >
          {meta.label}
        </span>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-left w-full text-sm text-slate-900"
          >
            <span className="font-medium">
              {flag.section}
            </span>
            <span className="text-slate-600"> — {flag.reason}</span>
          </button>
          {open && (
            <div className="mt-2 space-y-2">
              {flag.excerpt && (
                <blockquote className="text-xs text-slate-700 border-l-2 border-slate-300 pl-3 italic">
                  &ldquo;{flag.excerpt}&rdquo;
                </blockquote>
              )}
              {flag.suggestion && (
                <p className="text-xs text-emerald-800">
                  <strong>Öneri:</strong> {flag.suggestion}
                </p>
              )}
            </div>
          )}
        </div>
        <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
          {flag.severity}/5
        </span>
      </div>
    </li>
  )
}
