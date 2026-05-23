'use server'
import { createClient } from '@/lib/supabase/server'
import { REPORT_PACK } from '@/lib/stripe'
import { iyzicoConfigured, initializeCheckoutForm } from '@/lib/iyzico'
import { randomUUID } from 'crypto'

/**
 * Pricing page'den çağrılır: kullanıcıyı Iyzico checkout sayfasına yönlendirir.
 *
 * Akış:
 *   1. Auth check → user gerekli
 *   2. Conversation ID üret (idempotency + callback eşleştirme)
 *   3. Iyzico checkout form initialize → paymentPageUrl
 *   4. Browser'ı o URL'e redirect
 *
 * NOT (2026-05-19): Iyzico env vars henüz yok. Bu function şu an
 * `IYZICO_NOT_CONFIGURED` döner — pricing page'de WhatsApp fallback gösterilir.
 * Yüksel'den env vars gelince otomatik aktif olur.
 */
export async function createReportPackCheckout(): Promise<
  | { ok: true; paymentPageUrl: string }
  | { ok: false; error: 'UNAUTHENTICATED' | 'NOT_CONFIGURED' | 'CHECKOUT_FAILED'; message?: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'UNAUTHENTICATED' }
  }

  if (!iyzicoConfigured) {
    return { ok: false, error: 'NOT_CONFIGURED', message: 'Iyzico henüz yapılandırılmadı' }
  }

  const conversationId = randomUUID()
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://netportai.com'}/api/webhooks/iyzico`

  // Iyzico checkout için minimum buyer info — gerçek isim/soyisim profile'dan çekilebilir,
  // şimdilik email split + placeholder.
  const email = user.email ?? 'user@netport.com.tr'
  const nameGuess = email.split('@')[0]

  try {
    const { paymentPageUrl } = await initializeCheckoutForm({
      conversationId,
      callbackUrl,
      buyerId: user.id,
      buyerEmail: email,
      buyerName: nameGuess,
      buyerSurname: 'Netport',
      priceTry: REPORT_PACK.priceTry,
    })

    // Idempotency: conversationId'yi DB'ye kaydet — callback'te eşleştirilecek
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('iyzico_pending_payments') as any).insert({
      conversation_id: conversationId,
      user_id: user.id,
      pack_id: REPORT_PACK.id,
      report_count: REPORT_PACK.reports,
      price_try: REPORT_PACK.priceTry,
      status: 'pending',
    })

    return { ok: true, paymentPageUrl }
  } catch (err) {
    console.error('[iyzico] checkout init failed:', err)
    return {
      ok: false,
      error: 'CHECKOUT_FAILED',
      message: (err as Error).message ?? 'Ödeme sayfası açılamadı',
    }
  }
}
