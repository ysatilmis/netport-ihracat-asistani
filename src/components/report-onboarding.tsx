'use client'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'netport_report_onboarding_seen'

/**
 * Yeni kullanıcı için tek-seferlik rapor ipucu. localStorage ile işaretlenir;
 * kapatıldıktan sonra bir daha gösterilmez. Ağır ürün turu DEĞİL — tek banner.
 * SSR hydration uyumsuzluğunu önlemek için ilk render'da gizli, mount sonrası karar verir.
 */
export function ReportOnboarding() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true)
    } catch {
      // localStorage erişilemiyor — sessizce geç
    }
  }, [])

  const dismiss = () => {
    setShow(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // yok say
    }
  }

  if (!show) return null

  return (
    <aside className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5 text-sm text-blue-900">
        <span className="text-lg leading-none shrink-0" aria-hidden>
          👋
        </span>
        <p className="leading-relaxed">
          <strong>Raporun hazır!</strong> Soldaki <strong>İçindekiler</strong>&apos;den
          bölümlere atlayabilir, aşağıdaki çubuktan raporu <strong>PDF olarak indirebilir</strong> veya
          paylaşabilirsin. Tüm analiz tek raporda — ekstra bir şey üretmene gerek yok.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-md bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 transition-colors whitespace-nowrap"
      >
        Anladım
      </button>
    </aside>
  )
}
