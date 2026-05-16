'use client'
import { useState } from 'react'
import { ProductForm } from './product-form'
import { ReportProgress } from './report-progress'
import { ReportView } from './report-view'
import { ReportSection as ReportSectionCard } from './report-section'
import { CountryChooser } from './country-chooser'
import { SearchingAnimation } from './searching-animation'
import { DEEP_DIVE_SECTIONS, TARGET_COUNTRIES_SECTION } from '@/lib/report-prompts'
import type { CountryOption } from '@/lib/report-prompts'

type SectionData = { title: string; text: string; phase: number }
type ReportState = Record<string, SectionData>
type FlowStep = 'form' | 'countries_streaming' | 'choosing' | 'deep_dive' | 'done'

interface DashboardClientProps {
  defaultProduct: string
}

export function DashboardClient({ defaultProduct }: DashboardClientProps) {
  const [step, setStep] = useState<FlowStep>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Faz 1 §1 (target_countries) çıktısı
  const [countriesText, setCountriesText] = useState('')
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([])

  // Deep dive bölümleri
  const [sections, setSections] = useState<ReportState>({})
  const [streamingSection, setStreamingSection] = useState<string | undefined>()
  const [currentPhase, setCurrentPhase] = useState<number | undefined>()
  const [completedCount, setCompletedCount] = useState(0)

  const [reportProduct, setReportProduct] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')

  // ── Aşama 1: ürün gönder, 3 ülke gelsin ─────────────────────────────
  const handleProductSubmit = async (product: string) => {
    setIsLoading(true)
    setError(null)
    setStep('countries_streaming')
    setReportProduct(product)
    setCountriesText('')
    setCountryOptions([])
    setSections({})
    setCompletedCount(0)
    setSelectedCountry('')

    try {
      const res = await fetch('/api/report/countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      })

      if (res.status === 429) {
        setError('Bu ay token limitiniz doldu.')
        setStep('form')
        setIsLoading(false)
        return
      }
      if (!res.ok) {
        setError(`Hata (${res.status}): sunucudan yanıt alınamadı.`)
        setStep('form')
        setIsLoading(false)
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
            const event = JSON.parse(line.slice(6)) as {
              type: string
              text?: string
              countries?: CountryOption[]
              message?: string
              raw?: string
            }

            if (event.type === 'chunk' && event.text) {
              setCountriesText((prev) => prev + event.text)
            } else if (event.type === 'countries' && event.countries) {
              setCountryOptions(event.countries)
              setStep('choosing')
            } else if (event.type === 'countries_parse_error') {
              setError(event.message ?? 'Ülke listesi ayıklanamadı.')
            } else if (event.type === 'error' && event.message) {
              setError(event.message)
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err) {
      setError(`Bağlantı hatası: ${(err as Error).message}`)
      setStep('form')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Aşama 2: kullanıcı ülke seçti, deep dive başlasın ───────────────
  const handleCountryPick = async (country: string) => {
    setIsLoading(true)
    setError(null)
    setStep('deep_dive')
    setSelectedCountry(country)
    setSections({})
    setStreamingSection(undefined)
    setCurrentPhase(undefined)
    setCompletedCount(0)

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: reportProduct,
          country,
          countriesContext: countriesText,
        }),
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
      DEEP_DIVE_SECTIONS.forEach((s) => {
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
              message?: string
            }

            if (event.type === 'phase_start' && event.phase) {
              setCurrentPhase(event.phase)
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
              setStep('done')
            } else if (event.type === 'error' && event.message) {
              setError(event.message)
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      setError(`Bağlantı hatası: ${(err as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setStep('form')
    setCountriesText('')
    setCountryOptions([])
    setSections({})
    setCompletedCount(0)
    setSelectedCountry('')
    setError(null)
    setStreamingSection(undefined)
    setCurrentPhase(undefined)
  }

  // ── Render ──────────────────────────────────────────────────────────
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
          1) Ürününü yaz, AI 3 hedef pazar önersin. 2) Birini seç. 3) O ülke için 10 bölümlük zincirleme analiz akar.
        </p>
      </div>

      {/* Form */}
      {step === 'form' && (
        <div className="max-w-xl mb-8 p-6 rounded-2xl bg-white border" style={{ borderColor: 'var(--border)' }}>
          <ProductForm
            defaultProduct={defaultProduct}
            onSubmit={handleProductSubmit}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-xl mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
          <button className="ml-3 underline text-red-600 hover:text-red-800" onClick={reset}>
            Tekrar dene
          </button>
        </div>
      )}

      {/* Araştırma animasyonu — veri gelene kadar */}
      {step === 'countries_streaming' && !countriesText && (
        <SearchingAnimation />
      )}

      {/* Aşama 1 çıktısı — target_countries section'ı */}
      {(step === 'countries_streaming' || step === 'choosing' || step === 'deep_dive' || step === 'done') && countriesText && (
        <ReportSectionCard
          title={TARGET_COUNTRIES_SECTION.title}
          text={countriesText}
          phase={1}
          isStreaming={step === 'countries_streaming'}
        />
      )}

      {/* Ülke seçici */}
      {step === 'choosing' && countryOptions.length > 0 && (
        <CountryChooser
          countries={countryOptions}
          product={reportProduct}
          onPick={handleCountryPick}
          disabled={isLoading}
        />
      )}

      {/* Aşama 2 (deep dive) progress */}
      {(step === 'deep_dive' || step === 'done') && (
        <>
          <div className="my-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
            style={{ backgroundColor: '#eef6ff', color: '#1e40af' }}>
            <span>🎯</span>
            <span>Seçilen pazar: <strong>{selectedCountry}</strong> — 10 bölüm bu ülkeye özel.</span>
          </div>
          <ReportProgress
            completedSections={completedCount}
            currentSection={streamingSection
              ? DEEP_DIVE_SECTIONS.find((s) => s.key === streamingSection)?.title
              : undefined}
            currentPhase={currentPhase}
          />
          <ReportView
            product={reportProduct}
            country={selectedCountry}
            sections={sections}
            streamingSectionKey={streamingSection}
            countriesText={countriesText}
          />
        </>
      )}

      {/* Yeni rapor */}
      {step === 'done' && (
        <button
          className="mt-4 text-sm underline"
          style={{ color: 'var(--muted-foreground)' }}
          onClick={reset}
        >
          + Yeni rapor oluştur
        </button>
      )}
    </div>
  )
}

