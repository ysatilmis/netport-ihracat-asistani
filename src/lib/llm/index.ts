import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
})

export type LLMModel = 'perplexity' | 'openai' | 'claude'

const MODEL_MAP: Record<LLMModel, string> = {
  perplexity: 'perplexity/sonar-pro',
  openai: 'openai/gpt-4o',
  claude: 'anthropic/claude-sonnet-4-5',
}

export async function callLLMStream(model: LLMModel, prompt: string) {
  const result = streamText({
    model: openrouter(MODEL_MAP[model]),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  })
  return result
}
