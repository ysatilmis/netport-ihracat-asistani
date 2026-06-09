import { createClient } from '@/lib/supabase/server'
import { callLLMStream, type LLMModel } from '@/lib/llm'
import { checkCredits, recordTokenUsage } from '@/lib/token'
import { countriesRequestSchema, zodErrorResponse } from '@/lib/validation/schemas'
import { sanitizeError } from '@/lib/utils'
import {
  TARGET_COUNTRIES_SECTION,
  extractCountries,
} from '@/lib/report-prompts'
import { extractCountriesWithClaude } from '@/lib/extract-countries-claude'
import { matchCommonExport } from '@/lib/gtip/common-tr-exports'

export const maxDuration = 90

function sseLine(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

/** GTİP kodu bulunduysa prompt'un başına kesin referans verisi olarak ekle */
function buildGtipGroundingBlock(gtipCode: string, description: string): string {
  const formatted = `${gtipCode.substring(0, 4)}.${gtipCode.substring(4, 6)}`
  return `
## ⚠️ KESİN REFERANS VERİSİ (BU VERİLERİ KULLAN, UYDURMA)

Bu ürünün Türkiye GTİP kodu: **${formatted} — ${description}**
Bu kod kesindir. Gümrük tarifesi, ticaret istatistikleri ve tüm referanslarda bu kodu kullan.
Uydurma GTİP kodu vermek YASAK — emin değilsen boş bırak.

**Gümrük Birliği Uyarısı:** Bu bir tarım/gıda ürünüdür. Türkiye-AB Gümrük Birliği **sadece sanayi ürünlerini kapsar.**
Tarım ürünleri AB'nin Ortak Tarım Politikası (CAP) kapsamındadır — ek gümrük vergisi, tarife kotası ve kota uygulanabilir.
"GB kapsamında %0 gümrük" ifadesi bu ürün için YANLIŞTIR. Gerçek tarife oranını TARIC/Eurostat'tan kontrol et, bulamazsan "araştırılmalı" yaz.

**Fiyat Uyarısı:** Birim fiyat verirken güncel piyasa verisini kullan. Genel/eskimiş rakam verme.
Emin değilsen fiyat aralığı ver ve "Ticaret Bakanlığı / İhracatçı Birlikleri güncel fiyatlarıyla teyit edilmeli" notunu ekle.
`.trim()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    await checkCredits(user.id)
  } catch (e) {
    const msg = (e as Error).message
    console.error('[report/countries] checkCredits failed:', msg)
    if (msg === 'INSUFFICIENT_CREDITS' || msg.includes('SUBSCRIPTION')) {
      return new Response(
        JSON.stringify({ error: 'TOKEN_LIMIT_EXCEEDED' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }
    return new Response(
      JSON.stringify({ error: 'CREDIT_CHECK_FAILED' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'INVALID_JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const parsed = countriesRequestSchema.safeParse(rawBody)
  if (!parsed.success) return zodErrorResponse(parsed.error)

  const productClean = parsed.data.product.trim()
  const section = TARGET_COUNTRIES_SECTION

  // GTİP kodunu çöz (varsa) — prompt'a grounding olarak enjekte edilecek
  const gtipMatch = matchCommonExport(productClean)
  const gtipGrounding = gtipMatch
    ? buildGtipGroundingBlock(gtipMatch.code, gtipMatch.description)
    : ''

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(enc.encode(sseLine(event)))

      let sectionText = ''

      try {
        send({
          type: 'section_start',
          section: section.key,
          title: section.title,
          phase: section.phase,
        })

        let prompt = section.buildPrompt(productClean, { previousSections: {} })
        // GTİP grounding bloğunu prompt'un en başına ekle (SOMUTLASTIRMA'dan önce)
        if (gtipGrounding) {
          prompt = gtipGrounding + '\n\n---\n\n' + prompt
        }
        const result = await callLLMStream(section.model as LLMModel, prompt, section.maxTokens)

        for await (const textChunk of result.textStream) {
          sectionText += textChunk
          send({ type: 'chunk', section: section.key, text: textChunk })
        }

        const usage = await result.usage
        const tokens = usage?.totalTokens ?? 0
        void recordTokenUsage(user.id, section.phase, section.key, tokens, section.model)

        send({ type: 'section_done', section: section.key })

        let countries = extractCountries(sectionText)
        if (!countries || countries.length === 0) {
          console.log('[Countries fallback] regex fail, Claude 2. pass devreye giriyor')
          const claudeCountries = await extractCountriesWithClaude(sectionText)
          if (claudeCountries && claudeCountries.length > 0) {
            console.log('[Countries fallback] Claude basarili,', claudeCountries.length, 'ulke ayiklandi')
            countries = claudeCountries
          }
        }

        if (countries && countries.length > 0) {
          send({ type: 'countries', countries, raw: sectionText, gtipCode: gtipMatch?.code ?? null, gtipDesc: gtipMatch?.description ?? null })
        } else {
          send({
            type: 'countries_parse_error',
            message: 'AI yanıtından ülke listesi ayıklanamadı. Lütfen yeniden deneyin.',
            raw: sectionText,
          })
        }

        send({ type: 'done', totalTokens: tokens })
      } catch (err) {
        console.error('[report/countries] error:', err)
        send({ type: 'error', message: sanitizeError((err as Error).message) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
