'use client'
import { useEffect, useSyncExternalStore, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  isExhausted?: boolean
}

const EU_COUNTRIES = new Set([
  'almanya', 'germany', 'fransa', 'france', 'hollanda', 'netherlands', 'italya', 'italy',
  'ispanya', 'spain', 'belçika', 'belgium', 'avusturya', 'austria', 'isveç', 'sweden',
  'danimarka', 'denmark', 'finlandiya', 'finland', 'polonya', 'poland', 'portekiz', 'portugal',
  'yunanistan', 'greece', 'çek cumhuriyeti', 'czech republic', 'macaristan', 'hungary',
  'romanya', 'romania', 'bulgaristan', 'bulgaria', 'hırvatistan', 'croatia', 'slovakya',
  'slovakia', 'slovenya', 'slovenia', 'litvanya', 'lithuania', 'letonya', 'latvia',
  'estonya', 'estonia', 'kıbrıs', 'cyprus', 'malta', 'lüksemburg', 'luxembourg', 'irlanda', 'ireland',
])

const AGRI_KEYWORDS = [
  'zeytinyağı', 'zeytin', 'incir', 'fındık', 'ceviz', 'fıstık', 'kayısı', 'kuru', 'organik',
  'tahıl', 'bakliyat', 'mercimek', 'nohut', 'fasulye', 'meyve', 'sebze', 'et', 'süt',
  'peynir', 'bal', 'tarım', 'gıda', 'yağ', 'un', 'buğday', 'arpa', 'şarap', 'üzüm',
  'domates', 'biber', 'patlıcan', 'elma', 'kiraz', 'çilek', 'frenk üzümü', 'kavun', 'karpuz',
]

function isEuCountry(country: string): boolean {
  return EU_COUNTRIES.has(country.toLowerCase().trim())
}

function isAgriculturalProduct(product: string): boolean {
  const lower = product.toLowerCase()
  return AGRI_KEYWORDS.some((kw) => lower.includes(kw))
}

export function DashboardClient({ defaultProduct, isExhausted = false }: DashboardClientProps) {
  const router = useRouter()
  const [euWarningDismissed, setEuWarningDismissed] = useState(false)
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

  // Refresh server components (nav credit meter, isExhausted) when report completes.
  // Credit is spent on the server at this point; stale nav would show wrong balance.
  useEffect(() => {
    if (step === 'done') {
      router.refresh()
    }
  }, [step, router])

  const handleProductSubmit = (product: string) => {
    void streamer.startCountries(product)
  }

  const handleCountryPick = (country: string) => {
    setEuWarningDismissed(false)
    void streamer.startDeepDive(country)
  }

  const reset = () => {
    streamer.reset()
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center">
      {/* Hero + Form (yan yana lg+) — sadece form aşamasında grid, diğer aşamalarda hero tam genişlik */}
      <div className={step === 'form' ? "w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start" : "w-full"}>
        {/* V3 Hero gradient banner */}
        <div className="hero-gradient w-full py-6 md:py-8 mb-4 border-b border-slate-200/60 overflow-hidden">
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

        {/* Form — sağ taraf, grid ile yan yana */}
        {step === 'form' && (
          <div
            className="h-fit mb-8 p-8 rounded-2xl bg-white border shadow-xl shadow-slate-200/40"
            style={{ borderColor: 'var(--border)', borderTopWidth: '2px', borderTopColor: isExhausted ? '#EF4444' : 'var(--accent)' }}
          >
            {isExhausted ? (
              <div className="flex flex-col gap-4 text-center py-2">
                <div className="text-3xl" aria-hidden>🔒</div>
                <div>
                  <p className="font-semibold text-slate-900 text-base mb-1">
                    Bu ayki rapor hakkın bitti.
                  </p>
                  <p className="text-sm text-slate-600">
                    Yeni rapor üretmek için ek paket satın alabilirsin.
                  </p>
                </div>
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  Rapor Paketi Satın Al →
                </a>
              </div>
            ) : (
              <ProductForm
                defaultProduct={defaultProduct}
                onSubmit={handleProductSubmit}
                isLoading={isLoading}
              />
            )}
          </div>
        )}
      </div>

      {/* Akış göstergesi — stream devam ediyorsa sayfaya tekrar girince sahnede kalsın */}
      {isLoading && (
        <div className="max-w-xl mb-6 p-3 rounded-xl bg-[var(--p1-bg)] border border-[var(--p1-line)] text-sm text-[var(--p1-fg)] flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--phase-1)] animate-pulse" />
          <span>Rapor hazırlanıyor...</span>
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
                ? countriesText.slice(0, 400).trimEnd() + '...'
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

      {/* AB Gümrük Uyarısı — tarım ürünü + AB ülkesi kombinasyonunda */}
      {(step === 'deep_dive' || step === 'done') &&
        !euWarningDismissed &&
        selectedCountry &&
        isEuCountry(selectedCountry) &&
        isAgriculturalProduct(reportProduct) && (
          <div className="w-full max-w-2xl mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0" aria-hidden>⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    AB Gümrük Uyarısı: {selectedCountry} bir AB üyesidir
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Türkiye-AB Gümrük Birliği sanayi ürünlerini kapsar, ancak tarım ve gıda
                    ürünleri için AB&apos;nin Ortak Tarım Politikası (OTP) kapsamında ek gümrük
                    vergisi ve kota uygulanabilir. Gerçek tarife oranını{' '}
                    <strong>Yasal &amp; Gümrük Çerçevesi</strong> bölümünde kontrol edin. Amerika
                    veya Güney Kore gibi AB dışı pazarlar bu ürün için daha uygun olabilir.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEuWarningDismissed(true)}
                className="text-amber-600 hover:text-amber-800 shrink-0 text-lg leading-none"
                aria-label="Uyarıyı kapat"
              >
                ×
              </button>
            </div>
          </div>
        )}

      {/* Aşama 2 (deep dive) progress */}
      {(step === 'deep_dive' || step === 'done') && (
        <>
          <div className="my-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-[var(--p1-bg)] text-[var(--p1-fg)] border border-[var(--p1-line)]">
            <span aria-hidden>🎯</span>
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
            <div className="p-4 rounded-xl bg-[var(--p2-bg)] border border-[var(--p2-line)] text-sm flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[var(--p2-fg)] font-medium">✅ Rapor otomatik kaydedildi.</span>
              <a
                href={`/results/${savedReportId}`}
                className="font-medium text-[var(--p2-fg)] hover:underline"
              >
                📄 Raporlarım'da görüntüle →
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
                  {selectedCountry} için USP, alıcı persona'ları, hedef dilde ürün
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
