import { createClient } from '@/lib/supabase/server'
import { callLLMStream, type LLMModel } from '@/lib/llm'
import { checkTokenLimit, recordTokenUsage } from '@/lib/token'
import { countriesRequestSchema, zodErrorResponse } from '@/lib/validation/schemas'
import { sanitizeError } from '@/lib/utils'
import {
  TARGET_COUNTRIES_SECTION,
  extractCountries,
} from '@/lib/report-prompts'
import { extractCountriesWithClaude } from '@/lib/extract-countries-claude'

export const maxDuration = 90

function sseLine(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`
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
        { status: 429, headers: { 'Content-Type': 'application/json' } },
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
  const parsed = countriesRequestSchema.safeParse(rawBody)
  if (!parsed.success) return zodErrorResponse(parsed.error)

  const productClean = parsed.data.product.trim()
  const section = TARGET_COUNTRIES_SECTION

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

        const prompt = section.buildPrompt(productClean, { previousSections: {} })
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
          send({ type: 'countries', countries, raw: sectionText })
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
