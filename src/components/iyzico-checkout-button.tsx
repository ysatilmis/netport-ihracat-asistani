'use client'
import { useState, useTransition } from 'react'
import { createReportPackCheckout } from '@/actions/iyzico'

interface IyzicoCheckoutButtonProps {
  priceTry: number
}

export function IyzicoCheckoutButton({ priceTry }: IyzicoCheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const result = await createReportPackCheckout()
      if (result.ok) {
        window.location.href = result.paymentPageUrl
      } else {
        setError(
          result.error === 'UNAUTHENTICATED'
            ? 'Giriş yapmanız gerekiyor'
            : result.error === 'NOT_CONFIGURED'
              ? 'Ödeme sistemi henüz hazır değil — WhatsApp ile iletişime geçin'
              : (result.message ?? 'Ödeme sayfası açılamadı, tekrar deneyin'),
        )
      }
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full px-6 py-4 rounded-xl bg-gradient-to-br from-[var(--accent)] to-red-600 text-white font-semibold text-base shadow-[0_4px_16px_rgba(232,86,10,0.25)] hover:shadow-[0_6px_24px_rgba(232,86,10,0.35)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-wait disabled:hover:translate-y-0"
      >
        <span className="inline-flex items-center gap-2">
          {isPending ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
              </svg>
              <span>Hazırlanıyor...</span>
            </>
          ) : (
            <>
              <span>Kartla Öde — ₺{priceTry}</span>
              <span aria-hidden>→</span>
            </>
          )}
        </span>
      </button>
      {error && (
        <div className="text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  )
}
