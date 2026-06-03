import { createClient } from '@/lib/supabase/server'
import { REPORT_PACKS } from '@/lib/stripe'
import { getCredits } from '@/lib/token'
import { iyzicoConfigured } from '@/lib/iyzico'
import { IyzicoCheckoutButton } from '@/components/iyzico-checkout-button'
import { Check } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FiyatlandÄ±rma â Netport Ä°hracat AsistanÄ±',
}

// YÃ¼ksel HanÄ±m'Ä±n WhatsApp numarasÄ±
const WHATSAPP_NUMBER = '905559891245'

function buildWhatsAppUrl(userEmail?: string | null, packLabel?: string, packPrice?: number) {
  const emailPart = userEmail ? `,${userEmail} kullanÄ±cÄ± hesabÄ±m iÃ§in` : ''
  const packPart = packLabel && packPrice ? ` ${packLabel} (âº${packPrice})` : ' ek rapor paketi'
  const message = encodeURIComponent(
    `Merhaba, Netport Ä°hracat AI uygulamasÄ±ndan ulaÅÄ±yorum${emailPart}${packPart} satÄ±n almak istiyorum.`,
  )
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let credits = 0
  if (user) {
    try {
      const balance = await getCredits(user.id)
      credits = balance.credits
    } catch {
      // subscription not found yet
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-mono text-slate-600 mb-5 shadow-sm">
          <span aria-hidden>ð¼</span>
          <span>FiyatlandÄ±rma</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3 leading-[1.08]">
          KayÄ±tta <span className="bg-gradient-to-r from-[var(--accent)] to-red-600 bg-clip-text text-transparent">1 kredi Ã¼cretsiz</span>.
          <br className="hidden md:block" />
          Daha fazlasÄ± mÄ±? Paket al.
        </h1>
        <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          KarmaÅÄ±k plan yok. KayÄ±t olunca 1 rapor kredisi hediye. Bittiyse ek paket satÄ±n al.
          Krediler sÃ¼resiz geÃ§erli â sÄ±fÄ±rlanmaz.
        </p>
      </div>

      {/* Mevcut durum (logged in) */}
      {user && (
        <div className="mb-10 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-6">
          <div className="flex items-baseline justify-between flex-wrap gap-3 mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Mevcut Durumun</h2>
            <span className="text-sm text-slate-500 font-mono">{credits} kredi</span>
          </div>
          <p className="text-sm text-slate-600">
            {credits === 0 ? (
              <>
                <span className="font-semibold text-red-600">Krediyin bitti.</span> Aþaðýdan paket alabilirsin.
              </>
            ) : credits === 1 ? (
              <>
                <span className="font-semibold text-amber-700">1 kredin kaldý.</span> Yetmezse aþaðýdan paket al.
              </>
            ) : (
              <>
                <span className="font-semibold text-emerald-700">{credits} kredi</span> kaldý.
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
                  En PopÃ¼ler
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

              {/* Fiyat â strikethrough + indirim */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">
                    âº{pack.priceTry.toLocaleString('tr-TR')}
                  </span>
                  <span className="text-2xl text-slate-400 line-through decoration-2 decoration-red-400/60 font-medium">
                    âº{pack.originalPrice.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-600">
                    <span aria-hidden>â¡</span>
                    KÄ±sa sÃ¼reliÄine
                  </span>
                  <span className="text-xs text-slate-400">
                    %{Math.round((1 - pack.priceTry / pack.originalPrice) * 100)} indirim
                  </span>
                </div>
                <span className="text-lg text-slate-400 ml-0 mt-2 inline-block font-mono">
                  Â· {pack.reports} rapor
                </span>
              </div>

              <p className="text-base text-slate-600 mb-6 leading-relaxed">{pack.description}</p>

              <ul className="space-y-3 mb-8">
                {[
                  `${pack.reports} tam ihracat pazar raporu`,
                  'Mevcut kredinize eklenir',
                  'Tek seferlik â abonelik yok',
                  'SÃ¼resi dolmaz',
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
                  Ãnce KayÄ±t Ol
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
                    <span>WhatsApp ile SatÄ±n Al</span>
                    <span aria-hidden>â</span>
                  </span>
                </a>
              )}

              <p className="text-center text-xs text-slate-400 mt-4">
                {!user
                  ? 'KayÄ±t Ã¼cretsiz, 1 kredin hemen aktif'
                  : iyzicoConfigured
                    ? 'Kartla gÃ¼venli Ã¶deme â 3D Secure korumalÄ±'
                    : 'WhatsApp Ã¼zerinden Netport\'a ulaÅ, Ã¶demeni yap, raporlarÄ±n hesabÄ±na tanÄ±mlansÄ±n'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bilgi notu */}
      <div className="rounded-2xl bg-[var(--p1-bg)] border border-[var(--p1-line)] p-5">
        <div className="flex gap-3 items-start">
          <div className="text-2xl">ð³</div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[var(--p1-fg)] mb-1">NasÄ±l Ã§alÄ±ÅÄ±r?</h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              WhatsApp ile Netport'a ulaÅÄ±rsÄ±n. Email adresin mesajda otomatik iletilir.
              Ãdeme linki email'ine gelir, kredi kartÄ±nla Ã¶dersin. Ãdeme onaylanÄ±nca rapor haklarÄ±n
              hesabÄ±na eklenir. SorularÄ±n iÃ§in:{' '}
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="font-medium text-[var(--primary)] hover:underline">
                +90 555 989 12 45
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
