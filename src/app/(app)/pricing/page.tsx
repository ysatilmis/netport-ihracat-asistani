import { createClient } from '@/lib/supabase/server'
import { REPORT_PACKS, PLAN_REPORT_LIMITS } from '@/lib/stripe'
import { getMonthlyUsage } from '@/lib/token'
import { iyzicoConfigured } from '@/lib/iyzico'
import { IyzicoCheckoutButton } from '@/components/iyzico-checkout-button'
import { Check } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fiyatlandırma — Netport İhracat Asistanı',
}

// Yüksel Hanım'ın WhatsApp numarası
const WHATSAPP_NUMBER = '905321377158'

function buildWhatsAppUrl(userEmail?: string | null, packLabel?: string, packPrice?: number) {
  const emailPart = userEmail ? `,${userEmail} kullanıcı hesabım için` : ''
  const packPart = packLabel && packPrice ? ` ${packLabel} (₺${packPrice})` : ' ek rapor paketi'
  const message = encodeURIComponent(
    `Merhaba, Netport İhracat AI uygulamasından ulaşıyorum${emailPart}${packPart} satın almak istiyorum.`,
  )
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`
}

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
          Aylık <span className="bg-gradient-to-r from-[var(--accent)] to-red-600 bg-clip-text text-transparent">2 rapor ücretsiz</span>.
          <br className="hidden md:block" />
          Daha fazlası mı? Paket al.
        </h1>
        <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Karmaşık plan yok. Her ay 2 tam ihracat raporu hakkın var. Bittiyse ek paket satın al.
          Mevcut periyodun sonuna kadar kullanılır.
        </p>
      </div>

      {/* Mevcut durum (logged in) */}
      {user && (
        <div className="mb-10 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-6">
          <div className="flex items-baseline justify-between flex-wrap gap-3 mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Mevcut Durumun</h2>
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
                <span className="font-semibold text-red-600">Aylık hakkın bitti.</span> Aşağıdan ek paket alabilirsin.
              </>
            ) : remaining <= 1 ? (
              <>
                <span className="font-semibold text-amber-700">{remaining} rapor hakkın kaldı.</span> Yetmezse aşağıdan paket al.
              </>
            ) : (
              <>
                <span className="font-semibold text-emerald-700">{remaining === Number.POSITIVE_INFINITY ? 'Sınırsız' : remaining} rapor</span> hakkın var.
              </>
            )}
          </p>
        </div>
      )}

      {/* Paketler */}
      <div className="grid gap-6 mb-10 md:grid-cols-2">
        {REPORT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`rounded-3xl bg-white border-2 overflow-hidden relative ${
              pack.popular
                ? 'border-[var(--accent)]/40 ring-2 ring-[var(--accent)]/20 shadow-[0_8px_32px_rgba(232,86,10,0.14)]'
                : 'border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
            }`}
          >
            {/* Gradient ribbon */}
            <div
              className="h-2 w-full"
              style={{
                background: pack.popular
                  ? 'linear-gradient(90deg, var(--accent) 0%, var(--primary) 100%)'
                  : 'linear-gradient(90deg, #94a3b8 0%, #64748b 100%)',
              }}
              aria-hidden
            />

            {pack.popular && (
              <div className="absolute top-4 right-4">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent-strong)] border border-[var(--accent)]/30">
                  En Popüler
                </span>
              </div>
            )}

            <div className="p-8 md:p-10">
              <div className="flex items-baseline justify-between flex-wrap gap-3 mb-2">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{pack.label}</h3>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent-strong)] border border-[var(--accent)]/30">
                  Tek Seferlik
                </span>
              </div>

              {/* Fiyat — strikethrough + indirim */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">
                    ₺{pack.priceTry.toLocaleString('tr-TR')}
                  </span>
                  <span className="text-2xl text-slate-400 line-through decoration-2 decoration-red-400/60 font-medium">
                    ₺{pack.originalPrice.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-600">
                    <span aria-hidden>⚡</span>
                    Kısa süreliğine
                  </span>
                  <span className="text-xs text-slate-400">
                    %{Math.round((1 - pack.priceTry / pack.originalPrice) * 100)} indirim
                  </span>
                </div>
                <span className="text-lg text-slate-400 ml-0 mt-2 inline-block font-mono">
                  · {pack.reports} rapor
                </span>
              </div>

              <p className="text-base text-slate-600 mb-6 leading-relaxed">{pack.description}</p>

              <ul className="space-y-3 mb-8">
                {[
                  `${pack.reports} tam ihracat pazar raporu`,
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

              {/* CTA */}
              {!user ? (
                <Link
                  href="/register"
                  className={`block w-full text-center px-6 py-4 rounded-xl text-white font-semibold text-base shadow-[0_4px_16px_rgba(232,86,10,0.25)] hover:shadow-[0_6px_24px_rgba(232,86,10,0.35)] hover:-translate-y-0.5 transition-all ${
                    pack.popular
                      ? 'bg-gradient-to-br from-[var(--accent)] to-red-600'
                      : 'bg-gradient-to-br from-slate-700 to-slate-800'
                  }`}
                >
                  Önce Kayıt Ol
                </Link>
              ) : iyzicoConfigured ? (
                <IyzicoCheckoutButton priceTry={pack.priceTry} />
              ) : (
                <a
                  href={buildWhatsAppUrl(user.email, pack.label, pack.priceTry)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center px-6 py-4 rounded-xl text-white font-semibold text-base shadow-[0_4px_16px_rgba(232,86,10,0.25)] hover:shadow-[0_6px_24px_rgba(232,86,10,0.35)] hover:-translate-y-0.5 transition-all ${
                    pack.popular
                      ? 'bg-gradient-to-br from-[var(--accent)] to-red-600'
                      : 'bg-gradient-to-br from-slate-700 to-slate-800'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span>WhatsApp ile Satın Al</span>
                    <span aria-hidden>→</span>
                  </span>
                </a>
              )}

              <p className="text-center text-xs text-slate-400 mt-4">
                {!user
                  ? 'Kayıt ücretsiz, 2 rapor hakkın hemen aktif'
                  : iyzicoConfigured
                    ? 'Kartla güvenli ödeme — 3D Secure korumalı'
                    : 'WhatsApp üzerinden Yüksel Hanım\'a ulaş, ödemeni yap, raporların hesabına tanımlansın'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bilgi notu */}
      <div className="rounded-2xl bg-[var(--p1-bg)] border border-[var(--p1-line)] p-5">
        <div className="flex gap-3 items-start">
          <div className="text-2xl">💳</div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[var(--p1-fg)] mb-1">Nasıl çalışır?</h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              WhatsApp ile Yüksel Hanım'a ulaşırsın. Email adresin mesajda otomatik iletilir.
              Ödeme linki email'ine gelir, kredi kartınla ödersin. Ödeme onaylanınca rapor hakların
              hesabına eklenir. Soruların için:{' '}
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="font-medium text-[var(--primary)] hover:underline">
                +90 532 137 71 58
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
