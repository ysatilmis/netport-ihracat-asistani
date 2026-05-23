import { createOpenAI } from '@ai-sdk/openai'
import { streamText, generateText } from 'ai'

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  headers: {
    'HTTP-Referer': 'https://netportai.com',
    'X-Title': 'Netport Ihracat Asistani',
  },
})

export type LLMModel = 'perplexity' | 'openai' | 'claude'

const MODEL_MAP: Record<LLMModel, string> = {
  perplexity: 'perplexity/sonar-pro',
  openai: 'openai/gpt-4o',
  claude: 'anthropic/claude-sonnet-4-6',
}

export interface LLMStreamResult {
  textStream: AsyncIterable<string>
  usage: Promise<{ totalTokens?: number } | undefined>
  finishReason: Promise<string | undefined>
}

export function callLLMStream(model: LLMModel, prompt: string, maxTokens?: number): LLMStreamResult {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY eksik — Vercel > Settings > Env Vars kontrol edin')

  const modelId = MODEL_MAP[model]

  if (model === 'perplexity') {
    // perplexity/sonar-pro returns `annotations` fields in streaming delta chunks
    // that the AI SDK's OpenAI parser does not recognise, causing stream errors.
    // Workaround: use generateText (non-streaming) then yield the full text in chunks.
    const resultPromise = generateText({
      model: openrouter(modelId),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
    })

    const textStream = (async function* () {
      const r = await resultPromise
      console.log('[Perplexity finish]', modelId, r.finishReason, r.text.length, 'chars', r.usage?.totalTokens ?? 0, 'tokens')
      const chunkSize = 80
      for (let i = 0; i < r.text.length; i += chunkSize) {
        yield r.text.slice(i, i + chunkSize)
      }
    })()

    return {
      textStream,
      usage: resultPromise.then(r => r.usage),
      finishReason: resultPromise.then(r => r.finishReason as string | undefined),
    }
  }

  // openai / claude — normal streaming
  const result = streamText({
    model: openrouter(modelId),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
    onError: ({ error }) => {
      console.error('[LLM stream error]', modelId, error)
    },
    onFinish: ({ finishReason, text, usage }) => {
      console.log('[LLM finish]', modelId, finishReason, text.length, 'chars', usage?.totalTokens ?? 0, 'tokens')
    },
  })

  return {
    textStream: result.textStream,
    usage: Promise.resolve(result.usage).then(u => u),
    finishReason: Promise.resolve(result.finishReason).then(r => r as string | undefined),
  }
}
