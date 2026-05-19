import { createClient } from '@/lib/supabase/server'
import { callLLMStream, type LLMModel } from '@/lib/llm'
import { checkTokenLimit, recordTokenUsage } from '@/lib/token'
import { reportRequestSchema, zodErrorResponse } from '@/lib/validation/schemas'
import {
  DEEP_DIVE_SECTIONS,
  TARGET_COUNTRIES_SECTION,
  PHASE_META,
  type PromptContext,
  type PreviousSection,
} from '@/lib/report-prompts'

export const maxDuration = 300

function sseLine(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

// Sonraki section'lara context olarak verilmek üzere bir section'ın özet kısmını çıkarır.
// "## Yönetici Özeti" ile "## Detaylar" arasındaki bölüm. Bulunamazsa ilk 600 karakter.
function extractSummary(text: string): string {
  if (!text) return ''
  const summaryMatch = text.match(/##\s*Yönetici Özeti\s*\n([\s\S]*?)(?=\n##\s|$)/i)
  if (summaryMatch?.[1]) {
    return summaryMatch[1].trim()
  }
  // Eski format / Perplexity çıktısı: özet başlığı yok → ilk paragraflar
  return text.slice(0, 600).trim()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    await checkTokenLimit(user.id)
  } catch (e) {
    if ((e as Error).message === 'TOKEN_LIMIT_EXCEEDED') {
      return new Response(
        JSON.stringify({ error: 'TOKEN_LIMIT_EXCEEDED' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
    throw e
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
  const parsed = reportRequestSchema.safeParse(rawBody)
  if (!parsed.success) return zodErrorResponse(parsed.error)
  const body = parsed.data

  const productClean = body.product.trim()
  const countryClean = body.country.trim()
  const countriesContextText = body.countriesContext?.trim() || ''
  let totalTokens = 0

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(enc.encode(sseLine(event)))

      // target_countries section'ını re-run etmek yerine kullanıcıdan gelen
      // önceki çıktıyı bağlam olarak yerleştir.
      // Sprint v4: sadece özet kısmını context olarak ver (token tasarrufu).
      const previousSections: Record<string, PreviousSection> = {}
      // Tam metni de tut — kayıt için lazım.
      const fullSections: Record<string, PreviousSection> = {}
      if (countriesContextText) {
        previousSections[TARGET_COUNTRIES_SECTION.key] = {
          title: TARGET_COUNTRIES_SECTION.title,
          text: extractSummary(countriesContextText),
        }
        fullSections[TARGET_COUNTRIES_SECTION.key] = {
          title: TARGET_COUNTRIES_SECTION.title,
          text: countriesContextText,
        }
      }

      try {
        let currentPhase = 0

        for (let idx = 0; idx < DEEP_DIVE_SECTIONS.length; idx++) {
          const section = DEEP_DIVE_SECTIONS[idx]

          if (section.phase !== currentPhase) {
            currentPhase = section.phase
            send({
              type: 'phase_start',
              phase: currentPhase,
              title: PHASE_META[currentPhase as keyof typeof PHASE_META].title,
            })
          }

          send({
            type: 'section_start',
            section: section.key,
            title: section.title,
            phase: section.phase,
          })

          const ctx: PromptContext = {
            selectedCountry: countryClean,
            previousSections,
          }
          const prompt = section.buildPrompt(productClean, ctx)

          let sectionText = ''

          try {
            const result = await callLLMStream(section.model as LLMModel, prompt, section.maxTokens)

            for await (const textChunk of result.textStream) {
              sectionText += textChunk
              send({ type: 'chunk', section: section.key, text: textChunk })
            }

            const usage = await result.usage
            const tokens = usage?.totalTokens ?? 0
            totalTokens += tokens
            void recordTokenUsage(user.id, section.phase, section.key, tokens, section.model)
          } catch (sectionErr) {
            console.error(`[report] section ${section.key} failed:`, sectionErr)
            const rawMsg = (sectionErr as Error).message ?? ''
            const isProviderLimit =
              rawMsg.includes('Key limit exceeded') ||
              rawMsg.includes('rate limit') ||
              rawMsg.includes('Rate limit')
            if (isProviderLimit) {
              send({
                type: 'error',
                code: 'PROVIDER_LIMIT',
                message: 'Servis şu an yoğun, lütfen birkaç dakika bekleyip tekrar deneyin.',
              })
              break
            }
            const errMsg = `\n\n[Bu bölüm yüklenirken hata oluştu: ${rawMsg}]`
            sectionText += errMsg
            send({ type: 'chunk', section: section.key, text: errMsg })
          }

          // Sprint v4: sonraki section'lara sadece özet ver (token tasarrufu).
          previousSections[section.key] = {
            title: section.title,
            text: extractSummary(sectionText),
          }
          fullSections[section.key] = {
            title: section.title,
            text: sectionText,
          }

          send({ type: 'section_done', section: section.key })

          const nextSection = DEEP_DIVE_SECTIONS[idx + 1]
          if (!nextSection || nextSection.phase !== currentPhase) {
            send({ type: 'phase_done', phase: currentPhase })
          }
        }

        // Stream başarılı bittikten sonra raporu otomatik kaydet.
        try {
          const allSections: Record<string, { title: string; text: string; phase: number }> = {}

          if (countriesContextText) {
            allSections[TARGET_COUNTRIES_SECTION.key] = {
              title: TARGET_COUNTRIES_SECTION.title,
              text: countriesContextText,
              phase: TARGET_COUNTRIES_SECTION.phase,
            }
          }

          for (const section of DEEP_DIVE_SECTIONS) {
            const prev = fullSections[section.key]
            if (prev) {
              allSections[section.key] = {
                title: prev.title,
                text: prev.text,
                phase: section.phase,
              }
            }
          }

          const outputText = Object.values(allSections)
            .map((s) => `## ${s.title}\n\n${s.text}`)
            .join('\n\n---\n\n')

          const insert = {
            user_id: user.id,
            phase: 0,
            prompt_key: 'full_report',
            input_json: { product: productClean, country: countryClean },
            output_text: outputText,
            report_sections: allSections,
            is_full_report: true,
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: saved, error: saveErr } = await (supabase.from('reports') as any)
            .insert(insert)
            .select('id')
            .single()

          if (saveErr) {
            console.error('[report] auto-save error:', saveErr)
          } else if (saved?.id) {
            console.log('[report] auto-save ok, id:', saved.id)
            send({ type: 'saved', id: saved.id })
          }
        } catch (saveErr) {
          console.error('[report] auto-save exception:', saveErr)
        }

        send({ type: 'done', totalTokens, selectedCountry: countryClean })
      } catch (err) {
        console.error('[report] stream error:', err)
        const rawMsg = (err as Error).message ?? ''
        const isProviderLimit =
          rawMsg.includes('Key limit exceeded') ||
          rawMsg.includes('rate limit') ||
          rawMsg.includes('Rate limit')
        send({
          type: 'error',
          code: isProviderLimit ? 'PROVIDER_LIMIT' : undefined,
          message: isProviderLimit
            ? 'Servis şu an yoğun, lütfen birkaç dakika bekleyip tekrar deneyin.'
            : rawMsg,
        })
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
