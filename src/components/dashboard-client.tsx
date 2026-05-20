'use client'
import { useEffect, useSyncExternalStore } from 'react'
import { ProductForm } from './product-form'
import { ReportProgress } from './report-progress'
import { ReportView } from './report-view'
import { ReportSection as ReportSectionCard } from './report-section'
import { CountryChooser } from './country-chooser'
import { SearchingAnimation } from './searching-animation'
import { DEEP_DIVE_SECTIONS, TARGET_COUNTRIES_SECTION } from '@/lib/report-prompts'
import { getReportStreamer, getServerSnapshot } from '@/lib/report-streamer'

interface DashboardClientProps {
  defaultProduct: string
}

export function DashboardClient({ defaultProduct }: DashboardClientProps) {
  const streamer = getReportStreamer()
  const state = useSyncExternalStore(
    streamer.subscribe,
    streamer.getSnapshot,
    getServerSnapshot,
  )

  // Hydrate from sessionStorage after first client render to avoid SSR
  // hydration mismatch. Safe to call multiple times â€” guarded internally.
  useEffect(() => {
    streamer.hydrateFromStorage()
  }, [streamer])

  const {
    step,
    isLoading,
    error,
    errorCode,
    countriesText,
    countryOptions,
    sections,
    streamingSection,
    currentPhase,
    completedCount,
    reportProduct,
    selectedCountry,
    savedReportId,
  } = state

  const handleProductSubmit = (product: string) => {
    void streamer.startCountries(product)
  }

  const handleCountryPick = (country: string) => {
    void streamer.startDeepDive(country)
  }

  const reset = () => streamer.reset()

  return (
    <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* V3 Hero gradient banner */}
      <div className="hero-gradient -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 md:py-8 mb-4 border-b border-slate-200/60">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3 md:mb-4 leading-[1.08]">
          İhracat Pazar Analizi
        </h1>
        {reportProduct && (
          <p className="mb-4 text-base font-medium text-slate-600 md:text-lg">
            <span className="bg-gradient-to-r from-[var(--accent)] to-red-600 bg-clip-text text-transparent font-semibold">{reportProduct}</span> için rapor
          </p>
        )}
        <ol className="max-w-2xl space-y-2 text-base md:text-lg text-slate-700">
          <li className="flex items-start gap-3">
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              1
            </span>
            <div>
              <span className="font-semibold text-slate-900">Ürününü yaz.</span> Ne ihraç etmek istediğini kısaca anlat.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              2
            </span>
            <div>
              <span className="font-semibold text-slate-900">AI en uygun 3 ihracat pazarını önerir</span> — büyüklük + neden uygun.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              3
            </span>
            <div>
              <span className="font-semibold text-slate-900">Pazarı seç.</span> Seçilen ülke için
              10 bölümlük zincirleme analiz akar.
            </div>
          </li>
        </ol>
      </div>

      {/* AkÄ±ÅŸ gÃ¶stergesi â€” stream devam ediyorsa sayfaya tekrar girince sahnede kalsÄ±n */}
      {isLoading && (
        <div className="max-w-xl mb-6 p-3 rounded-xl bg-[var(--p1-bg)] border border-[var(--p1-line)] text-sm text-[var(--p1-fg)] flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--phase-1)] animate-pulse" />
          <span>Rapor hazırlanıyor...</span>
        </div>
      )}

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
      {error && errorCode === 'PROVIDER_LIMIT' && (
        <div className="max-w-xl mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          âš ï¸ {error}
          <button className="ml-3 underline text-amber-700 hover:text-amber-900" onClick={reset}>
            Tekrar dene
          </button>
        </div>
      )}
      {error && errorCode === 'TOKEN_LIMIT_EXCEEDED' && (
        <div className="max-w-xl mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 flex items-center justify-between gap-3 flex-wrap">
          <span>ğŸ”’ {error}</span>
          <a
            href="/pricing"
            className="font-semibold text-white px-3 py-1.5 rounded-lg text-xs"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Plan YÃ¼kselt â†’
          </a>
        </div>
      )}
      {error && !errorCode && (
        <div className="max-w-xl mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
          <button className="ml-3 underline text-red-600 hover:text-red-800" onClick={reset}>
            Tekrar dene
          </button>
        </div>
      )}

      {/* AraÅŸtÄ±rma animasyonu â€” veri gelene kadar */}
      {step === 'countries_streaming' && !countriesText && <SearchingAnimation />}

      {/* AÅŸama 1 Ã§Ä±ktÄ±sÄ± â€” target_countries section'Ä± */}
      {(step === 'countries_streaming' ||
        step === 'choosing' ||
        step === 'deep_dive' ||
        step === 'done') &&
        countriesText && (
          <ReportSectionCard
            title={TARGET_COUNTRIES_SECTION.title}
            text={
              step === 'choosing' && countriesText.length > 400
                ? countriesText.slice(0, 400).trimEnd() + 'â€¦'
                : countriesText
            }
            phase={1}
            isStreaming={step === 'countries_streaming'}
          />
        )}

      {/* Ãœlke seÃ§ici */}
      {step === 'choosing' && countryOptions.length > 0 && (
        <CountryChooser
          countries={countryOptions}
          product={reportProduct}
          onPick={handleCountryPick}
          disabled={isLoading}
        />
      )}

      {/* AÅŸama 2 (deep dive) progress */}
      {(step === 'deep_dive' || step === 'done') && (
        <>
          <div className="my-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-[var(--p1-bg)] text-[var(--p1-fg)] border border-[var(--p1-line)]">
            <span aria-hidden>ğŸ¯</span>
            <span>
              SeÃ§ilen pazar: <strong>{selectedCountry}</strong> â€” 10 bÃ¶lÃ¼m bu Ã¼lkeye Ã¶zel.
            </span>
          </div>
          <ReportProgress
            completedSections={completedCount}
            currentSection={
              streamingSection
                ? DEEP_DIVE_SECTIONS.find((s) => s.key === streamingSection)?.title
                : undefined
            }
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

      {/* Done â€” kaydedildi + faz B + yeni rapor */}
      {step === 'done' && (
        <div className="mt-6 flex flex-col gap-3">
          {savedReportId && (
            <div className="p-4 rounded-xl bg-[var(--p2-bg)] border border-[var(--p2-line)] text-sm flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[var(--p2-fg)] font-medium">âœ… Rapor otomatik kaydedildi.</span>
              <a
                href={`/results/${savedReportId}`}
                className="font-medium text-[var(--p2-fg)] hover:underline"
              >
                ğŸ“„ RaporlarÄ±m&apos;da gÃ¶rÃ¼ntÃ¼le â†’
              </a>
            </div>
          )}
          {savedReportId && (
            <a
              href={`/positioning/${savedReportId}`}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex items-start justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-slate-900 mb-0.5">
                  ğŸ¯ Faz B â€” KonumlandÄ±rma Paketi
                </div>
                <p className="text-sm text-slate-600">
                  {selectedCountry} iÃ§in USP, alÄ±cÄ± persona&apos;larÄ±, hedef dilde Ã¼rÃ¼n
                  aÃ§Ä±klamasÄ± ve cold email taslaklarÄ±.
                </p>
              </div>
              <span className="text-sm text-slate-500 whitespace-nowrap">Devam et â†’</span>
            </a>
          )}
          <button
            className="text-sm underline self-start mt-2"
            style={{ color: 'var(--muted-foreground)' }}
            onClick={reset}
          >
            + Yeni rapor oluÅŸtur
          </button>
        </div>
      )}
    </div>
  )
}
