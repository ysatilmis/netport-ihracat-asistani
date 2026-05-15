import { createClient } from '@/lib/supabase/server'
import { callLLMStream, type LLMModel } from '@/lib/llm'
import { fillTemplate } from '@/lib/prompts'
import { checkTokenLimit, recordTokenUsage } from '@/lib/token'
import type { Database } from '@/lib/supabase/types'

type PromptTemplate = Database['public']['Tables']['prompt_templates']['Row']

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
      return new Response(JSON.stringify({ error: 'TOKEN_LIMIT_EXCEEDED' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw e
  }

  const { promptKey, inputs } = await request.json() as {
    promptKey: string
    inputs: Record<string, string>
  }

  const { data: template } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('key', promptKey)
    .single() as { data: PromptTemplate | null; error: unknown }

  if (!template) {
    return new Response('Template not found', { status: 404 })
  }

  const filledPrompt = fillTemplate(template.template_text, inputs)

  try {
    const streamResult = await callLLMStream(template.model as LLMModel, filledPrompt)

    void streamResult.usage.then((usage) => {
      void recordTokenUsage(
        user.id,
        template.phase as 1 | 2 | 3,
        promptKey,
        usage.totalTokens ?? 0,
        template.model
      )
    }).catch((err) => {
      console.error('[analyze] usage tracking failed:', err)
    })

    return streamResult.toTextStreamResponse()
  } catch (err) {
    console.error('[analyze] LLM call failed:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: 'LLM_ERROR', detail: msg, model: template.model }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
