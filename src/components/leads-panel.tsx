'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { LeadsRow } from '@/actions/leads'
import type { Lead } from '@/lib/lead-finder'

interface Props {
  reportId: string
  initial: LeadsRow | null
  product?: string
  country?: string
}

const SCALE_COLOR: Record<string, string> = {
  'Büyük': 'bg-blue-50 text-blue-900 border-blue-200',
  'Orta': 'bg-violet-50 text-violet-900 border-violet-200',
  'KOBİ': 'bg-teal-50 text-teal-900 border-teal-200',
}

function LeadCard({ lead }: { lead: Lead }) {
  const scaleCls = SCALE_COLOR[lead.scale] ?? 'bg-slate-100 text-slate-900 border-slate-200'
  return (
    <li className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col gap-2">
      <div className="flex items-start gap-2 justify-between">
        <h3 className="text-sm font-semibold text-slate-900 leading-snug">{lead.name}</h3>
        {lead.scale && (
          <span
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${scaleCls}`}
          >
            {lead.scale}
          </span>
        )}
      </div>
      {lead.description && (
        <p className="text-xs text-slate-700 leading-relaxed">{lead.description}</p>
      )}
      {lead.website && (
        <a
          href={lead.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline truncate"
        >
          {lead.website}
        </a>
      )}
      {lead.source && (
        <p className="text-[11px] text-slate-400 italic leading-snug">{lead.source}</p>
      )}
    </li>
  )
}

export function LeadsPanel({ reportId, initial, product, country }: Props) {
  const [row, setRow] = useState<LeadsRow | null>(initial)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const run = () => {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/leads/${reportId}`, { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? `HTTP ${res.status}`)
        return
      }
      // useState(initial) doesn't reinitialize on router.refresh() — refetch via GET
      const dataRes = await fetch(`/api/leads/${reportId}`)
      const data = await dataRes.json().catch(() => null)
      if (data?.data) {
        setRow(data.data)
      } else {
        router.refresh()
      }
    })
  }

  const locationLabel = country ? `${country}'daki` : 'hedef pazardaki'

  if (!row && !isPending) {
    return (
      <aside className="mb-6 p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <div className="font-semibold text-slate-900">🎯 Alıcı Bul</div>
          <p className="text-slate-600">
            Perplexity ile {locationLabel} B2B alıcı firmaları bul.
          </p>
        </div>
        <button
          onClick={run}
          disabled={isPending}
          className="text-sm px-3 py-1.5 rounded-md font-medium text-white shadow-sm disabled:opacity-60"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Alıcı listesi üret
        </button>
        {error && <p className="text-xs text-rose-700 w-full">{error}</p>}
      </aside>
    )
  }

  if (isPending && !row) {
    return (
      <aside className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-900 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Alıcı listesi hazırlanıyor — ~15-30 saniye.
      </aside>
    )
  }

  if (!row) return null

  // Row var ama henüz tetiklenmemiş (pending) — Hazırla butonu göster
  if (row.status === 'pending') {
    return (
      <aside className="mb-6 p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <div className="font-semibold text-slate-900">🎯 B2B Alıcı Listesi</div>
          <p className="text-slate-600">
            Henüz hazırlanmadı. Hazırla butonuna bas, Perplexity ile {locationLabel} alıcıları bulsun.
          </p>
        </div>
        <button
          onClick={run}
          disabled={isPending}
          className="text-sm px-3 py-1.5 rounded-md font-medium text-white shadow-sm disabled:opacity-60"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Hazırla
        </button>
        {error && <p className="text-xs text-rose-700 w-full">{error}</p>}
      </aside>
    )
  }

  if (row.status === 'failed') {
    return (
      <aside className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-900 flex items-center justify-between">
        <span>❌ Alıcı listesi başarısız: {row.error_message ?? 'bilinmeyen hata'}</span>
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

  if (row.status === 'running' || isPending) {
    return (
      <aside className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-900 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Alıcı listesi hazırlanıyor…
      </aside>
    )
  }

  const leads = (row.leads_json ?? []) as Lead[]

  return (
    <aside className="mb-6 p-5 rounded-2xl border border-emerald-200 bg-emerald-50">
      <header className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            🎯 Alıcı Listesi
            <span className="text-xs font-normal text-slate-500">
              {leads.length} firma · sonar-pro
            </span>
          </h2>
          {(product || country) && (
            <p className="text-sm text-slate-600 mt-0.5">
              {product}{product && country ? ' → ' : ''}{country}
            </p>
          )}
        </div>
        <button
          onClick={run}
          disabled={isPending}
          className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          ↻ Yeniden çalıştır
        </button>
      </header>

      {leads.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {leads.map((lead, i) => (
            <LeadCard key={i} lead={lead} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-600">Alıcı bulunamadı.</p>
      )}

      {error && <p className="text-xs text-rose-700 mt-3">{error}</p>}
    </aside>
  )
}
