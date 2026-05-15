import { createClient } from '@/lib/supabase/server'
import { callLLMStream, type LLMModel } from '@/lib/llm'
import { checkTokenLimit, recordTokenUsage } from '@/lib/token'
import { REPORT_SECTIONS, PHASE_META } from '@/lib/report-prompts'

export const maxDuration = 120

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
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
    throw e
  }

  const { product, country = '' } = await request.json() as {
    product: string
    country?: string
  }

  if (!product?.trim()) {
    return new Response(JSON.stringify({ error: 'product is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let totalTokens = 0
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(enc.encode(sseLine(event)))

      try {
        let currentPhase = 0

        for (const section of REPORT_SECTIONS) {
          if (section.phase !== currentPhase) {
            currentPhase = section.phase
            send({ type: 'phase_start', phase: currentPhase, title: PHASE_META[currentPhase as keyof typeof PHASE_META].title })
          }

          send({ type: 'section_start', section: section.key, title: section.title, phase: section.phase })

          const prompt = section.buildPrompt(product.trim(), country.trim())

          try {
            const result = await callLLMStream(section.model as LLMModel, prompt)

            for await (const textChunk of result.textStream) {
              send({ type: 'chunk', section: section.key, text: textChunk })
            }

            const usage = await result.usage
            const tokens = usage?.totalTokens ?? 0
            totalTokens += tokens
            void recordTokenUsage(user.id, section.phase, section.key, tokens, section.model)
          } catch (sectionErr) {
            console.error(`[report] section ${section.key} failed:`, sectionErr)
            send({ type: 'chunk', section: section.key, text: `\n\n[Bu bölüm yüklenirken hata oluştu: ${(sectionErr as Error).message}]` })
          }

          send({ type: 'section_done', section: section.key })

          const idx = REPORT_SECTIONS.indexOf(section)
          const nextSection = REPORT_SECTIONS[idx + 1]
          if (!nextSection || nextSection.phase !== currentPhase) {
            send({ type: 'phase_done', phase: currentPhase })
          }
        }

        send({ type: 'done', totalTokens })
      } catch (err) {
        console.error('[report] stream error:', err)
        send({ type: 'error', message: (err as Error).message })
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
