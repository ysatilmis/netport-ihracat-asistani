import { createClient } from '@/lib/supabase/server'
import { callLLMStream, type LLMModel } from '@/lib/llm'
import { checkTokenLimit, recordTokenUsage } from '@/lib/token'
import { positioningRequestSchema, zodErrorResponse } from '@/lib/validation/schemas'
import {
  POSITIONING_SECTIONS,
  detectTargetLanguage,
  type PositioningContext,
  type PositioningSectionKey,
} from '@/lib/positioning-prompts'

export const maxDuration = 300

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
  const parsed = positioningRequestSchema.safeParse(rawBody)
  if (!parsed.success) return zodErrorResponse(parsed.error)
  const body = parsed.data

  // İlgili raporu çek
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report } = await (supabase.from('reports') as any)
    .select('id, user_id, input_json, output_text, report_sections')
    .eq('id', body.reportId)
    .single()

  if (!report) {
    return new Response(JSON.stringify({ error: 'report not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const product = String(report.input_json?.product ?? '').trim()
  const country = String(report.input_json?.country ?? '').trim()
  if (!product || !country) {
    return new Response(
      JSON.stringify({ error: 'report missing product or country' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Hedef pazar özeti: target_countries section + ilk birkaç deep-dive section
  // çıktısı concatenate edilir; Claude'a bağlam olarak verilir.
  const sections = report.report_sections ?? {}
  const marketSummary = [
    sections.target_countries?.text,
    sections.pazar_buyuklugu?.text,
    sections.rakipler?.text,
  ]
    .filter(Boolean)
    .join('\n\n---\n\n')
    .slice(0, 4000)

  const lang = detectTargetLanguage(country)

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(enc.encode(sseLine(event)))

      const previousSections: Partial<Record<PositioningSectionKey, string>> = {}
      let totalTokens = 0
      let packageId: string | null = null

      try {
        send({
          type: 'package_start',
          product,
          country,
          targetLanguage: lang.code,
          languageLabel: lang.label,
        })

        // Boş bir paket satırı oluştur (her section bittikçe upsert ile dolduracağız)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: created } = await (supabase.from('positioning_packages') as any)
          .insert({
            user_id: user.id,
            report_id: body.reportId,
            product,
            country,
            target_language: lang.code,
            is_complete: false,
          })
          .select('id')
          .single()

        if (created?.id) {
          packageId = created.id
          send({ type: 'package_id', id: packageId })
        }

        for (const section of POSITIONING_SECTIONS) {
          send({
            type: 'section_start',
            section: section.key,
            title: section.title,
            emoji: section.emoji,
          })

          const ctx: PositioningContext = {
            product,
            country,
            targetLanguage: lang.code,
            languageLabel: lang.label,
            marketSummary,
            previousSections,
          }
          const prompt = section.buildPrompt(ctx)

          let sectionText = ''
          try {
            const result = await callLLMStream('claude' as LLMModel, prompt)
            for await (const textChunk of result.textStream) {
              sectionText += textChunk
              send({ type: 'chunk', section: section.key, text: textChunk })
            }
            const usage = await result.usage
            const tokens = usage?.totalTokens ?? 0
            totalTokens += tokens
            void recordTokenUsage(user.id, 2, `positioning_${section.key}`, tokens, 'claude')
          } catch (sectionErr) {
            console.error(`[positioning] ${section.key} failed:`, sectionErr)
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
            const msg = `\n\n[Bölüm hatası: ${rawMsg}]`
            sectionText += msg
            send({ type: 'chunk', section: section.key, text: msg })
          }

          previousSections[section.key] = sectionText
          send({ type: 'section_done', section: section.key })

          // Section bittiğinde paketi update et
          if (packageId) {
            const colMap: Record<PositioningSectionKey, string> = {
              usp: 'usp_text',
              personas: 'personas_json',
              product_description: 'product_description',
              cold_email: 'cold_email',
            }
            const col = colMap[section.key]
            // personas_json kolonu jsonb — string olarak da kabul eder ama
            // tipi koru: JSON yapısı yok şu an, ham metin kaydet.
            const payload: Record<string, string> = {}
            payload[col] =
              section.key === 'personas'
                ? JSON.stringify({ raw: sectionText })
                : sectionText
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('positioning_packages') as any)
              .update(payload)
              .eq('id', packageId)
          }
        }

        // Paketi tamamlandı işaretle
        if (packageId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('positioning_packages') as any)
            .update({ is_complete: true })
            .eq('id', packageId)
          send({ type: 'saved', id: packageId })
        }

        send({ type: 'done', totalTokens })
      } catch (err) {
        console.error('[positioning] stream error:', err)
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
