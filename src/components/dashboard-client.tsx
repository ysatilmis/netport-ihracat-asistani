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
  // hydration mismatch. Safe to call multiple times — guarded internally.
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
          1) Ürününü yaz. 2) AI en uygun 3 ihracat pazarını önerir — büyüklük + neden uygun. 3) Seç → o ülke için 10 bölümlük analiz üretilir.
        </p>
      </div>

      {/* Akış göstergesi — stream devam ediyorsa sayfaya tekrar girince sahnede kalsın */}
      {isLoading && (
        <div className="max-w-xl mb-6 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Rapor üretiliyor — sayfayı değiştirsen bile arka planda devam eder.</span>
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
          ⚠️ {error}
          <button className="ml-3 underline text-amber-700 hover:text-amber-900" onClick={reset}>
            Tekrar dene
          </button>
        </div>
      )}
      {error && errorCode === 'TOKEN_LIMIT_EXCEEDED' && (
        <div className="max-w-xl mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 flex items-center justify-between gap-3 flex-wrap">
          <span>🔒 {error}</span>
          <a
            href="/pricing"
            className="font-semibold text-white px-3 py-1.5 rounded-lg text-xs"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Plan Yükselt →
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

      {/* Araştırma animasyonu — veri gelene kadar */}
      {step === 'countries_streaming' && !countriesText && <SearchingAnimation />}

      {/* Aşama 1 çıktısı — target_countries section'ı */}
      {(step === 'countries_streaming' ||
        step === 'choosing' ||
        step === 'deep_dive' ||
        step === 'done') &&
        countriesText && (
          <ReportSectionCard
            title={TARGET_COUNTRIES_SECTION.title}
            text={
              step === 'choosing' && countriesText.length > 400
                ? countriesText.slice(0, 400).trimEnd() + '…'
                : countriesText
            }
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
          <div
            className="my-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
            style={{ backgroundColor: '#eef6ff', color: '#1e40af' }}
          >
            <span>🎯</span>
            <span>
              Seçilen pazar: <strong>{selectedCountry}</strong> — 10 bölüm bu ülkeye özel.
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

      {/* Done — kaydedildi + faz B + yeni rapor */}
      {step === 'done' && (
        <div className="mt-6 flex flex-col gap-3">
          {savedReportId && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm flex items-center justify-between gap-3 flex-wrap">
              <span className="text-green-800">✅ Rapor otomatik kaydedildi.</span>
              <a
                href={`/results/${savedReportId}`}
                className="font-medium text-green-700 hover:text-green-900 underline"
              >
                📄 Raporlarım&apos;da görüntüle →
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
                  🎯 Faz B — Konumlandırma Paketi
                </div>
                <p className="text-sm text-slate-600">
                  {selectedCountry} için USP, alıcı persona&apos;ları, hedef dilde ürün
                  açıklaması ve cold email taslakları.
                </p>
              </div>
              <span className="text-sm text-slate-500 whitespace-nowrap">Devam et →</span>
            </a>
          )}
          <button
            className="text-sm underline self-start mt-2"
            style={{ color: 'var(--muted-foreground)' }}
            onClick={reset}
          >
            + Yeni rapor oluştur
          </button>
        </div>
      )}
    </div>
  )
}
