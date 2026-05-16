'use server'

import { stripe, STRIPE_PRICES } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { PlanTier } from '@/lib/stripe'

export async function createCheckoutSession(tier: Exclude<PlanTier, 'free'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Giriş yapmanız gerekiyor')

  const priceId = STRIPE_PRICES[tier]
  if (!priceId) throw new Error('Fiyat tanımlı değil')

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: user.id, tier },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
  })

  if (!session.url) throw new Error('Checkout oturumu oluşturulamadı')
  redirect(session.url)
}

export async function createBillingPortalSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Giriş yapmanız gerekiyor')

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single() as { data: { stripe_customer_id: string } | null; error: unknown }

  if (!sub?.stripe_customer_id) {
    throw new Error('Abonelik bulunamadı')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })

  redirect(session.url)
}
