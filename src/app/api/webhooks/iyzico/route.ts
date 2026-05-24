import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { iyzicoConfigured, retrieveCheckoutForm } from '@/lib/iyzico'
import { REPORT_PACK } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  if (!iyzicoConfigured) {
    return NextResponse.json({ error: 'IYZICO_NOT_CONFIGURED' }, { status: 503 })
  }

  let token: string | null = null
  try {
    const bodyText = await req.text()
    const params = new URLSearchParams(bodyText)
    token = params.get('token')
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  if (!token) {
    return NextResponse.json({ error: 'NO_TOKEN' }, { status: 400 })
  }

  let payment: Awaited<ReturnType<typeof retrieveCheckoutForm>>
  try {
    payment = await retrieveCheckoutForm(token)
  } catch (err) {
    console.error('[iyzico webhook] retrieve failed:', err)
    return NextResponse.redirect(
      new URL('/pricing?payment=error', req.url),
      { status: 303 },
    )
  }

  // Service client — bypasses RLS, no session needed
  const supabase = await createServiceClient()

  // Pending row'u conversationId ile bul
  const { data: pending } = await supabase
    .from('iyzico_pending_payments')
    .select('user_id, status, report_count')
    .eq('conversation_id', payment.conversationId)
    .single() as { data: { user_id: string; status: string; report_count: number } | null; error: unknown }

  if (!pending) {
    console.error('[iyzico webhook] pending payment not found', payment.conversationId)
    return NextResponse.redirect(new URL('/pricing?payment=not_found', req.url), { status: 303 })
  }

  if (pending.status === 'completed') {
    return NextResponse.redirect(new URL('/dashboard?payment=success', req.url), { status: 303 })
  }

  if (payment.paymentStatus !== 'SUCCESS') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('iyzico_pending_payments') as any)
      .update({ status: 'failed', iyzico_payment_id: payment.paymentId })
      .eq('conversation_id', payment.conversationId)
    return NextResponse.redirect(new URL('/pricing?payment=failed', req.url), { status: 303 })
  }

  const reportCount = pending.report_count ?? REPORT_PACK.reports

  // Atomic increment via RPC or direct value set
  // postgres function not deployed yet — read-then-write with service client (no RLS)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('extra_tokens')
    .eq('user_id', pending.user_id)
    .single() as { data: { extra_tokens: number | null } | null; error: unknown }

  const currentExtra = sub?.extra_tokens ?? 0
  // Sanity check: negative values, NaN, absurdly high values
  const safeCurrent = isNaN(currentExtra) || currentExtra < 0 ? 0 : currentExtra > 10000 ? 10000 : currentExtra
  const newExtra = safeCurrent + reportCount

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('subscriptions') as any)
    .update({ extra_tokens: newExtra })
    .eq('user_id', pending.user_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('iyzico_pending_payments') as any)
    .update({
      status: 'completed',
      iyzico_payment_id: payment.paymentId,
      completed_at: new Date().toISOString(),
    })
    .eq('conversation_id', payment.conversationId)

  console.log('[iyzico webhook] payment success', {
    userId: pending.user_id,
    paymentId: payment.paymentId,
    reportCount,
    newExtra,
  })

  return NextResponse.redirect(new URL('/dashboard?payment=success', req.url), { status: 303 })
}
