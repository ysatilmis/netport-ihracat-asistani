import Stripe from 'stripe'

// Build-time'da STRIPE_SECRET_KEY yoksa modül yüklemesini bozma — runtime'da
// gerekli endpoint çağrıldığında authenticator hatası atar.
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

// Token paket fiyatları — ESTIMATED_TOKENS_PER_REPORT (25K) ile hizalı.
// Her paket en az 1 tam rapor garantisi. Stripe price ID'leri (₺9/₺19/₺49) aynı.
export const TOKEN_PACKS = {
  small: { tokens: 25000, price: 9, label: '1 Rapor (25K Token)', priceId: STRIPE_PRICES.token_small },
  medium: { tokens: 75000, price: 19, label: '3 Rapor (75K Token)', priceId: STRIPE_PRICES.token_medium },
  large: { tokens: 250000, price: 49, label: '10 Rapor (250K Token)', priceId: STRIPE_PRICES.token_large },
} as const

export type TokenPackSize = keyof typeof TOKEN_PACKS

export const PLANS = {
  free: {
    name: 'Ücretsiz',
    tokens: 80000,
    price: 0,
    priceId: null,
    features: ['3 tam rapor/ay', 'Temel ülke analizi', 'Sonuçları görüntüleme'],
  },
  starter: {
    name: 'Starter',
    tokens: 250000,
    price: 29,
    priceId: STRIPE_PRICES.starter,
    features: ['10 tam rapor/ay', 'Tüm analiz aşamaları', 'PDF indirme', 'E-posta desteği'],
  },
  pro: {
    name: 'Pro',
    tokens: 500000,
    price: 79,
    priceId: STRIPE_PRICES.pro,
    features: ['Sınırsız rapor', 'Öncelikli analiz', 'Özel prompt', 'Telefon desteği', 'CSV export'],
  },
} as const

export type PlanTier = keyof typeof PLANS

export const ESTIMATED_TOKENS_PER_REPORT = 25000
