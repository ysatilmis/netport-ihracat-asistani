'use client'
import { useEffect, useState } from 'react'
import { Markdown } from '@/components/markdown'
import { POSITIONING_SECTIONS, type PositioningSectionKey } from '@/lib/positioning-prompts'

type SectionTextMap = Partial<Record<PositioningSectionKey, string>>

interface Props {
  reportId: string
  product: string
  country: string
  initialPackage?: {
    id: string
    target_language: string
    usp_text: string
    personas_json: { raw?: string } | null
    product_description: string
    cold_email: string
    is_complete: boolean
  } | null
}

export function PositioningClient({ reportId, product, country, initialPackage }: Props) {
  const [sections, setSections] = useState<SectionTextMap>(() => {
    if (!initialPackage) return {}
    return {
      usp: initialPackage.usp_text || undefined,
      personas: initialPackage.personas_json?.raw || undefined,
      product_description: initialPackage.product_description || undefined,
      cold_email: initialPackage.cold_email || undefined,
    }
  })
  const [streaming, setStreaming] = useState<PositioningSectionKey | undefined>()
  const [packageId, setPackageId] = useState<string | null>(initialPackage?.id ?? null)
  const [language, setLanguage] = useState(initialPackage?.target_language ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(initialPackage?.is_complete ?? false)

  useEffect(() => {
    if (initialPackage?.is_complete) setIsDone(true)
  }, [initialPackage])

  const start = async () => {
    setIsRunning(true)
    setIsDone(false)
    setError(null)
    setSections({})
    setStreaming(undefined)
    setPackageId(null)

    try {
      const res = await fetch('/api/positioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
      })

      if (!res.ok) {
        setError(`Hata (${res.status})`)
        setIsRunning(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6)) as {
              type: string
              section?: PositioningSectionKey
              text?: string
              id?: string
              languageLabel?: string
              message?: string
            }
            if (ev.type === 'package_id' && ev.id) {
              setPackageId(ev.id)
            } else if (ev.type === 'package_start' && ev.languageLabel) {
              setLanguage(ev.languageLabel)
            } else if (ev.type === 'section_start' && ev.section) {
              setStreaming(ev.section)
              setSections((prev) => ({ ...prev, [ev.section!]: '' }))
            } else if (ev.type === 'chunk' && ev.section && ev.text) {
              setSections((prev) => ({
                ...prev,
                [ev.section!]: (prev[ev.section!] ?? '') + ev.text,
              }))
            } else if (ev.type === 'section_done') {
              setStreaming(undefined)
            } else if (ev.type === 'saved' && ev.id) {
              setPackageId(ev.id)
            } else if (ev.type === 'done') {
              setIsDone(true)
            } else if (ev.type === 'error' && ev.message) {
              setError(ev.message)
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err) {
      setError(`Bağlantı hatası: ${(err as Error).message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const completedCount = POSITIONING_SECTIONS.filter((s) => sections[s.key]).length
  const hasAny = completedCount > 0

  return (
    <div>
      {/* Hero */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
              Faz B · Konumlandırma & İletişim
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              {product} <span className="text-slate-400">→</span> {country}
            </h1>
            {language && (
              <p className="text-sm text-slate-600 mt-2">
                Hedef dil: <span className="font-medium text-slate-900">{language}</span>
              </p>
            )}
          </div>
          {!isRunning && !hasAny && (
            <button
              onClick={start}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              🎯 Konumlandırma paketini üret
            </button>
          )}
          {!isRunning && hasAny && !isDone && (
            <button
              onClick={start}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 border border-slate-300 bg-white hover:bg-slate-50"
            >
              ↻ Yeniden üret
            </button>
          )}
        </div>

        {isRunning && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>
              Konumlandırma paketi üretiliyor · {completedCount}/{POSITIONING_SECTIONS.length} bölüm tamamlandı
            </span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {isDone && packageId && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
            ✅ Konumlandırma paketi hazır. Kopyala / yazdır / kullan.
          </div>
        )}
      </header>

      {/* Sections */}
      {!hasAny && !isRunning && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
          <div className="text-5xl mb-4" aria-hidden>
            🎯
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Henüz konumlandırma paketi yok
          </h2>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            Üst butona bas — AI, <strong>{country}</strong> pazarı için USP + 3 alıcı persona + hedef dilde ürün
            açıklaması ve cold email taslakları üretir.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {POSITIONING_SECTIONS.map((s) => {
          const text = sections[s.key]
          if (!text) return null
          const isStreaming = streaming === s.key
          return (
            <section
              key={s.key}
              id={s.key}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <header className="mb-3 flex items-center gap-3">
                <span className="text-2xl" aria-hidden>
                  {s.emoji}
                </span>
                <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
                {isStreaming && (
                  <span className="text-xs text-blue-600 animate-pulse ml-auto">akıyor…</span>
                )}
              </header>
              <Markdown>{text}</Markdown>
            </section>
          )
        })}
      </div>
    </div>
  )
}
