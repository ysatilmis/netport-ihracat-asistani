import { createClient } from '@/lib/supabase/server'
import { REPORT_PACK, PLAN_REPORT_LIMITS } from '@/lib/stripe'
import { getMonthlyUsage } from '@/lib/token'
import { iyzicoConfigured } from '@/lib/iyzico'
import { IyzicoCheckoutButton } from '@/components/iyzico-checkout-button'
import { Check } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fiyatlandırma — Netport İhracat Asistanı',
}

// WhatsApp manuel ödeme akışı — Iyzico entegrasyonu canlıya gelene kadar geçici.
const WHATSAPP_NUMBER = '905069003820'
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Merhaba, Netport için 3 ek rapor paketi (₺499) satın almak istiyorum.',
)
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let used = 0
  let limit = PLAN_REPORT_LIMITS.free
  let remaining = limit
  if (user) {
    try {
      const usage = await getMonthlyUsage(user.id)
      used = usage.used
      limit = usage.limit
      remaining = limit < 0 ? Number.POSITIVE_INFINITY : Math.max(0, limit - used)
    } catch {
      // subscription not found yet
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-mono text-slate-600 mb-5 shadow-sm">
          <span aria-hidden>💼</span>
          <span>Fiyatlandırma</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3 leading-[1.08]">
          Aylık <span className="bg-gradient-to-r from-[var(--accent)] to-red-600 bg-clip-text text-transparent">3 rapor ücretsiz</span>.
          <br className="hidden md:block" />
          Daha fazlası mı? Pack alırsın.
        </h1>
        <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Karmaşık plan yok. Her ay 3 tam ihracat raporu hakkın var. Bittiyse 3'lük paket satın al.
          Mevcut periyodun sonuna kadar kullanılır.
        </p>
      </div>

      {/* Mevcut durum (logged in) */}
      {user && (
        <div className="mb-10 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-6">
          <div className="flex items-baseline justify-between flex-wrap gap-3 mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Mevcut Durum</h2>
            <span className="text-sm text-slate-500 font-mono">
              {limit < 0 ? 'Sınırsız (Pro)' : `${used} / ${limit} rapor`}
            </span>
          </div>
          {limit > 0 && (
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (used / limit) * 100)}%`,
                  background:
                    remaining === 0
                      ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                      : remaining <= 1
                        ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                        : 'linear-gradient(90deg, var(--accent), var(--primary))',
                }}
              />
            </div>
          )}
          <p className="text-sm text-slate-600">
            {remaining === 0 ? (
              <>
                <span className="font-semibold text-red-600">Aylık hakkın bitti.</span> Ek 3 rapor için aşağıdaki paketi al.
              </>
            ) : remaining <= 1 ? (
              <>
                <span className="font-semibold text-amber-700">{remaining} rapor hakkın kaldı.</span> Yetmezse aşağıdaki paketi al.
              </>
            ) : (
              <>
                <span className="font-semibold text-emerald-700">{remaining === Number.POSITIVE_INFINITY ? 'Sınırsız' : remaining} rapor</span> hakkın var.
              </>
            )}
          </p>
        </div>
      )}

      {/* Tek paket — Notion/Stripe V3 stil */}
      <div className="mb-10">
        <div className="rounded-3xl bg-white border-2 border-[var(--accent)]/30 ring-2 ring-[var(--accent)]/15 shadow-[0_8px_32px_rgba(232,86,10,0.12)] overflow-hidden relative">
          {/* Gradient ribbon */}
          <div
            className="h-2 w-full"
            style={{ background: 'linear-gradient(90deg, var(--accent) 0%, var(--primary) 100%)' }}
            aria-hidden
          />

          <div className="p-8 md:p-10">
            <div className="flex items-baseline justify-between flex-wrap gap-3 mb-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{REPORT_PACK.label}</h3>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                Tek Seferlik
              </span>
            </div>

            <div className="mb-6">
              <span className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">₺{REPORT_PACK.priceTry}</span>
              <span className="text-lg text-slate-400 ml-3 font-mono">·  {REPORT_PACK.reports} rapor</span>
            </div>

            <p className="text-base text-slate-600 mb-6 leading-relaxed">{REPORT_PACK.description}</p>

            <ul className="space-y-3 mb-8">
              {[
                '3 tam ihracat pazar raporu',
                'Aylık hakkına ek olarak çalışır',
                'Tek seferlik — abonelik yok',
                'Mevcut periyod boyunca geçerli',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                  </span>
                  <span className="leading-snug">{feat}</span>
                </li>
              ))}
            </ul>

            {/* CTA — Iyzico hazırsa kartla öde butonu, değilse WhatsApp fallback */}
            {!user ? (
              <Link
                href="/register"
                className="block w-full text-center px-6 py-4 rounded-xl bg-gradient-to-br from-[var(--accent)] to-red-600 text-white font-semibold text-base shadow-[0_4px_16px_rgba(232,86,10,0.25)] hover:shadow-[0_6px_24px_rgba(232,86,10,0.35)] hover:-translate-y-0.5 transition-all"
              >
                Önce Kayıt Ol
              </Link>
            ) : iyzicoConfigured ? (
              <IyzicoCheckoutButton priceTry={REPORT_PACK.priceTry} />
            ) : (
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-4 rounded-xl bg-gradient-to-br from-[var(--accent)] to-red-600 text-white font-semibold text-base shadow-[0_4px_16px_rgba(232,86,10,0.25)] hover:shadow-[0_6px_24px_rgba(232,86,10,0.35)] hover:-translate-y-0.5 transition-all"
              >
                <span className="inline-flex items-center gap-2">
                  <span>WhatsApp ile İletişim</span>
                  <span aria-hidden>→</span>
                </span>
              </a>
            )}

            <p className="text-center text-xs text-slate-400 mt-4">
              {!user
                ? 'Kayıt ücretsiz, 3 rapor hakkın hemen aktif'
                : iyzicoConfigured
                  ? 'Kartla güvenli ödeme — 3D Secure korumalı'
                  : 'Ödeme şu an manuel — Iyzico kart ödemesi yakında entegre olacak'}
            </p>
          </div>
        </div>
      </div>

      {/* Bilgi notu */}
      <div className="rounded-2xl bg-[var(--p1-bg)] border border-[var(--p1-line)] p-5 mb-8">
        <div className="flex gap-3 items-start">
          <div className="text-2xl">💳</div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[var(--p1-fg)] mb-1">Ödeme yöntemleri yakında</h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              Şu an satın alma WhatsApp üzerinden manuel kart ödemesi (Iyzico link) ile yapılıyor.
              Kısa süre içinde kart ödemesi doğrudan siteye entegre olacak. Sorularınız için WhatsApp:{' '}
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="font-medium text-[var(--primary)] hover:underline">
                +90 506 900 38 20
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Pro plan placeholder */}
      <div className="text-center text-sm text-slate-400">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full">
          <span aria-hidden>⏳</span>
          <span>Aylık sınırsız (Pro) plan yakında</span>
        </span>
      </div>
    </main>
  )
}
