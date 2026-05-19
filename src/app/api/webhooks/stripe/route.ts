import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const metaType = session.metadata?.type

        if (!userId) {
          console.error('[stripe webhook] Missing user_id in session metadata', session.id)
          break
        }

        // Token paketi tek seferlik alımı — extra_tokens artır.
        // Migration 013 uygulanana kadar try/catch ile sessiz fail.
        if (metaType === 'token_pack') {
          const tokensRaw = session.metadata?.tokens ?? '0'
          const tokensAdded = parseInt(tokensRaw, 10) || 0

          if (tokensAdded > 0) {
            try {
              const { data: existing } = await supabase
                .from('subscriptions')
                .select('extra_tokens')
                .eq('user_id', userId)
                .single() as { data: { extra_tokens: number | null } | null; error: unknown }

              const newExtra = (existing?.extra_tokens ?? 0) + tokensAdded
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase.from('subscriptions') as any)
                .update({ extra_tokens: newExtra })
                .eq('user_id', userId)

              console.log('[stripe webhook] Token pack purchased', {
                userId,
                size: session.metadata?.pack_size,
                tokensAdded,
                newExtra,
              })
            } catch (err) {
              console.error('[stripe webhook] Token pack update failed — apply migration 013 (extra_tokens column):', err)
            }
          }
          break
        }

        // Subscription alımı (default).
        const tier = session.metadata?.tier ?? 'starter'
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
        const tierLimits: Record<string, number> = { starter: 250000, pro: 500000, free: 80000 }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('subscriptions') as any).upsert({
          user_id: userId,
          plan: tier,
          monthly_limit_tokens: tierLimits[tier] ?? 250000,
          current_period_start: new Date().toISOString().slice(0, 10),
          current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
          stripe_customer_id: customerId ?? null,
          stripe_subscription_id: session.subscription as string ?? null,
        }, { onConflict: 'user_id' })

        console.log('[stripe webhook] Subscription activated', { userId, tier })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        if (sub.status === 'active' || sub.status === 'past_due') {
          const { data: existing } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .single() as { data: { user_id: string } | null; error: unknown }

          if (existing) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const periodEnd = (sub as any).current_period_end as number | undefined
            const endDate = new Date((periodEnd ?? Date.now() / 1000 + 30 * 86400) * 1000)
              .toISOString().slice(0, 10)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('subscriptions') as any).update({
              current_period_end: endDate,
            }).eq('stripe_subscription_id', sub.id)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('subscriptions') as any).update({
          plan: 'free',
          monthly_limit_tokens: 80000,
        }).eq('stripe_subscription_id', sub.id)

        console.log('[stripe webhook] Subscription cancelled → free', sub.id)
        break
      }
    }
  } catch (err) {
    console.error('[stripe webhook] Handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
