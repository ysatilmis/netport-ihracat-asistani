/**
 * Iyzico client wrapper — Netport için 3 ek rapor paketi ödeme entegrasyonu.
 *
 * Yapı: Yüksel Hanım'ın Iyzico merchant hesabı üzerinden ödeme alınır.
 * Müşteri /pricing → "Satın Al" → checkout form → 3D Secure → callback →
 * subscriptions.extra_tokens += 3.
 *
 * Env gereksinimleri (Yüksel'den gelecek):
 *   IYZICO_API_KEY        — sandbox-...-... veya prod
 *   IYZICO_SECRET_KEY     — Iyzico panel → Ayarlar → API
 *   IYZICO_BASE_URL       — https://sandbox-api.iyzipay.com (test) veya https://api.iyzipay.com (prod)
 *
 * SDK: iyzipay (resmi Iyzico Node SDK), npm i iyzipay
 *
 * NOT: Env yoksa modül yüklenir ama tüm çağrılar `IYZICO_NOT_CONFIGURED`
 * hatası atar — pricing page'de WhatsApp fallback aktif kalır.
 */

// @ts-expect-error iyzipay paketi @types yayınlamıyor — runtime'da CommonJS module
import Iyzipay from 'iyzipay'

const apiKey = process.env.IYZICO_API_KEY ?? ''
const secretKey = process.env.IYZICO_SECRET_KEY ?? ''
const baseUrl = process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com'

export const iyzicoConfigured = Boolean(apiKey && secretKey)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getIyzipayClient(): any {
  if (!iyzicoConfigured) {
    throw new Error('IYZICO_NOT_CONFIGURED — IYZICO_API_KEY / IYZICO_SECRET_KEY env vars missing')
  }
  if (!_client) {
    _client = new Iyzipay({ apiKey, secretKey, uri: baseUrl })
  }
  return _client
}

export interface CheckoutFormPayload {
  conversationId: string
  callbackUrl: string
  buyerId: string
  buyerEmail: string
  buyerName: string
  buyerSurname: string
  priceTry: number
}

/**
 * Iyzico Checkout Form Initialize — kullanıcıyı Iyzico'nun barındırdığı
 * checkout sayfasına yönlendiren formu hazırlar.
 *
 * Returns: { paymentPageUrl, token } veya hata fırlatır.
 */
export async function initializeCheckoutForm(payload: CheckoutFormPayload): Promise<{
  paymentPageUrl: string
  token: string
}> {
  const client = getIyzipayClient()
  const priceStr = payload.priceTry.toFixed(2)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise((resolve, reject) => {
    client.checkoutFormInitialize.create(
      {
        locale: 'tr',
        conversationId: payload.conversationId,
        price: priceStr,
        paidPrice: priceStr,
        currency: 'TRY',
        basketId: 'B-' + payload.conversationId,
        paymentGroup: 'PRODUCT',
        callbackUrl: payload.callbackUrl,
        enabledInstallments: [2, 3, 6, 9],
        buyer: {
          id: payload.buyerId,
          name: payload.buyerName,
          surname: payload.buyerSurname,
          gsmNumber: '+905000000000',
          email: payload.buyerEmail,
          identityNumber: '11111111111',
          registrationAddress: 'Türkiye',
          ip: '85.34.78.112',
          city: 'Istanbul',
          country: 'Turkey',
        },
        shippingAddress: {
          contactName: `${payload.buyerName} ${payload.buyerSurname}`,
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Dijital teslimat — fiziksel adres yok',
        },
        billingAddress: {
          contactName: `${payload.buyerName} ${payload.buyerSurname}`,
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Dijital teslimat — fiziksel adres yok',
        },
        basketItems: [
          {
            id: 'report-pack-3',
            name: '3 Ek Rapor Paketi',
            category1: 'Dijital Hizmet',
            category2: 'SaaS',
            itemType: 'VIRTUAL',
            price: priceStr,
          },
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, result: any) => {
        if (err) return reject(err)
        if (result?.status !== 'success') {
          return reject(new Error(result?.errorMessage ?? 'Iyzico checkout init failed'))
        }
        resolve({
          paymentPageUrl: result.paymentPageUrl as string,
          token: result.token as string,
        })
      },
    )
  })
}

/**
 * Iyzico Checkout Form Retrieve — callback sonrası ödemeyi doğrular.
 * Returns: { paymentStatus, paymentId, price, conversationId, buyerId } veya hata.
 */
export async function retrieveCheckoutForm(token: string): Promise<{
  paymentStatus: 'SUCCESS' | 'FAILURE'
  paymentId: string
  conversationId: string
  price: number
  buyerEmail?: string
}> {
  const client = getIyzipayClient()
  return new Promise((resolve, reject) => {
    client.checkoutForm.retrieve(
      { locale: 'tr', token },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any, result: any) => {
        if (err) return reject(err)
        if (result?.status !== 'success') {
          return reject(new Error(result?.errorMessage ?? 'Iyzico retrieve failed'))
        }
        resolve({
          paymentStatus: result.paymentStatus as 'SUCCESS' | 'FAILURE',
          paymentId: result.paymentId as string,
          conversationId: result.conversationId as string,
          price: Number(result.price),
          buyerEmail: result.itemTransactions?.[0]?.itemId ? undefined : result.buyer?.email,
        })
      },
    )
  })
}
