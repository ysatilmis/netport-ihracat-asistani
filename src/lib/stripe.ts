import Stripe from 'stripe'

// Build-time'da STRIPE_SECRET_KEY yoksa modül yüklemesini bozma — runtime'da
// gerekli endpoint çağrıldığında authenticator hatası atar.
// NOT (2026-05-19): Stripe akıbeti dondurulmuş durumda — Iyzico ile değiştirilecek.
// Webhook dosyası ve actions/stripe.ts kalır (sonra revert kolay) ama pricing UI'da
// kullanılmaz. PLANS / REPORT_PACK constant'ları yeni "rapor sayısı bazlı" semantikte.
const stripeKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    })
  : (null as unknown as Stripe)

export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  token_small: process.env.STRIPE_PRICE_TOKEN_SMALL ?? '',
  token_medium: process.env.STRIPE_PRICE_TOKEN_MEDIUM ?? '',
  token_large: process.env.STRIPE_PRICE_TOKEN_LARGE ?? '',
} as const

// Plan-bazlı aylık rapor kontenjanı — DB column açmıyoruz, kod tarafında hardcoded.
// -1 = sınırsız (Pro tier — şu anda kapalı, gelecek faz)
export const PLAN_REPORT_LIMITS: Record<PlanTier, number> = {
  free: 2,
  starter: 10,
  pro: -1,
}

// Tek paket: 3 ek rapor — Iyzico ile satın alınır.
// subscriptions.extra_tokens column'ı bu pack'lerden gelen rapor sayısını tutar
// (semantik 2026-05-19'da "extra_tokens" → "extra_reports" oldu, column adı korunur).
export const REPORT_PACK = {
  id: 'pack3',
  reports: 3,
  priceTry: 499,
  label: '3 Ek Rapor',
  description: 'Aylık 3 rapor hakkın bittiyse 3 ek rapor satın al. Mevcut periyodun sonuna kadar kullanılır.',
} as const

// Backward-compat: bazı dosyalar hâlâ ESTIMATED_TOKENS_PER_REPORT'a referans veriyor.
// Token meter'da artık kullanılmıyor ama silmiyoruz (compile uyum).
export const ESTIMATED_TOKENS_PER_REPORT = 25000

// Legacy TOKEN_PACKS — Stripe entegrasyonu disable, kod referans verirse hata vermesin.
// Pricing UI artık REPORT_PACK kullanır. Geri dönüş için saklıyoruz.
export const TOKEN_PACKS = {
  small: { tokens: 25000, price: 9, label: '1 Rapor (25K Token)', priceId: STRIPE_PRICES.token_small },
  medium: { tokens: 75000, price: 19, label: '3 Rapor (75K Token)', priceId: STRIPE_PRICES.token_medium },
  large: { tokens: 250000, price: 49, label: '10 Rapor (250K Token)', priceId: STRIPE_PRICES.token_large },
} as const

export type TokenPackSize = keyof typeof TOKEN_PACKS

export const PLANS = {
  free: {
    name: 'Ücretsiz',
    tokens: 80000, // legacy — artık kullanılmıyor; PLAN_REPORT_LIMITS bakılır
    reports: 2,
    price: 0,
    priceId: null,
    features: ['2 tam rapor/ay', 'Temel ülke analizi', 'Sonuçları görüntüleme'],
  },
  starter: {
    name: 'Starter',
    tokens: 250000,
    reports: 10,
    price: 29,
    priceId: STRIPE_PRICES.starter,
    features: ['10 tam rapor/ay', 'Tüm analiz aşamaları', 'PDF indirme', 'E-posta desteği'],
  },
  pro: {
    name: 'Pro',
    tokens: 500000,
    reports: -1,
    price: 79,
    priceId: STRIPE_PRICES.pro,
    features: ['Sınırsız rapor', 'Öncelikli analiz', 'Özel prompt', 'Telefon desteği', 'CSV export'],
  },
} as const

export type PlanTier = keyof typeof PLANS
