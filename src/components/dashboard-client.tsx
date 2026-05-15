'use client'
import { useState } from 'react'
import { ProductForm } from './product-form'
import { ReportProgress } from './report-progress'
import { ReportView } from './report-view'
import { REPORT_SECTIONS } from '@/lib/report-prompts'

type SectionData = { title: string; text: string; phase: number }
type ReportState = Record<string, SectionData>

interface DashboardClientProps {
  defaultProduct: string
}

export function DashboardClient({ defaultProduct }: DashboardClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [sections, setSections] = useState<ReportState>({})
  const [streamingSection, setStreamingSection] = useState<string | undefined>()
  const [currentPhase, setCurrentPhase] = useState<number | undefined>()
  const [completedCount, setCompletedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [reportProduct, setReportProduct] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [reportDone, setReportDone] = useState(false)

  const handleSubmit = async (product: string) => {
    setIsLoading(true)
    setSections({})
    setStreamingSection(undefined)
    setCurrentPhase(undefined)
    setCompletedCount(0)
    setError(null)
    setReportDone(false)
    setReportProduct(product)
    setSelectedCountry('')

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      })

      if (res.status === 429) {
        setError('Bu ay token limitiniz doldu.')
        setIsLoading(false)
        return
      }
      if (!res.ok) {
        setError(`Hata (${res.status}): sunucudan yanıt alınamadı.`)
        setIsLoading(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      const sectionTitles: Record<string, string> = {}
      const sectionPhases: Record<string, number> = {}
      REPORT_SECTIONS.forEach((s) => {
        sectionTitles[s.key] = s.title
        sectionPhases[s.key] = s.phase
      })

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
            const event = JSON.parse(line.slice(6)) as {
              type: string
              phase?: number
              section?: string
              text?: string
              totalTokens?: number
              message?: string
              country?: string
            }

            if (event.type === 'phase_start' && event.phase) {
              setCurrentPhase(event.phase)
            } else if (event.type === 'country_selected' && event.country) {
              setSelectedCountry(event.country)
            } else if (event.type === 'section_start' && event.section) {
              setStreamingSection(event.section)
              setSections((prev) => ({
                ...prev,
                [event.section!]: {
                  title: sectionTitles[event.section!] ?? event.section!,
                  text: '',
                  phase: (sectionPhases[event.section!] ?? 1) as 1 | 2 | 3 | 4,
                },
              }))
            } else if (event.type === 'chunk' && event.section && event.text) {
              setSections((prev) => ({
                ...prev,
                [event.section!]: {
                  ...prev[event.section!],
                  text: (prev[event.section!]?.text ?? '') + event.text,
                },
              }))
            } else if (event.type === 'section_done') {
              setStreamingSection(undefined)
              setCompletedCount((c) => c + 1)
            } else if (event.type === 'done') {
              setReportDone(true)
            } else if (event.type === 'error' && event.message) {
              setError(event.message)
            }
          } catch {
            // malformed JSON line — skip
          }
        }
      }
    } catch (err) {
      setError(`Bağlantı hatası: ${(err as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const hasReport = Object.keys(sections).length > 0

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            İhracat Raporu Oluştur
          </h1>
        </div>
        <p className="ml-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Ürününüzü girin — AI önce en uygun pazarı seçer, sonra zincirleme 11 bölümlük tam analiz üretir (araştırma → konumlandırma → satış → yönetici özeti).
        </p>
      </div>

      {/* Form */}
      {!hasReport && (
        <div className="max-w-xl mb-8 p-6 rounded-2xl bg-white border" style={{ borderColor: 'var(--border)' }}>
          <ProductForm
            defaultProduct={defaultProduct}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-xl mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
          <button
            className="ml-3 underline text-red-600 hover:text-red-800"
            onClick={() => { setError(null); setSections({}); setCompletedCount(0) }}
          >
            Tekrar dene
          </button>
        </div>
      )}

      {/* Selected country badge */}
      {selectedCountry && hasReport && (
        <div className="max-w-xl mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
          style={{ backgroundColor: 'var(--accent-soft, #eef6ff)', color: 'var(--accent, #1e40af)' }}>
          <span>🎯</span>
          <span>AI seçimi: <strong>{selectedCountry}</strong> pazarı — sonraki tüm bölümler bu ülkeye göre üretiliyor.</span>
        </div>
      )}

      {/* Progress */}
      {hasReport && (
        <ReportProgress
          completedSections={completedCount}
          currentSection={streamingSection
            ? REPORT_SECTIONS.find((s) => s.key === streamingSection)?.title
            : undefined}
          currentPhase={currentPhase}
        />
      )}

      {/* Report */}
      {hasReport && (
        <ReportView
          product={reportProduct}
          country={selectedCountry}
          sections={sections}
          streamingSectionKey={streamingSection}
        />
      )}

      {/* New report button */}
      {reportDone && (
        <button
          className="mt-4 text-sm underline"
          style={{ color: 'var(--muted-foreground)' }}
          onClick={() => {
            setSections({})
            setCompletedCount(0)
            setReportDone(false)
            setError(null)
          }}
        >
          + Yeni rapor oluştur
        </button>
      )}
    </div>
  )
}
