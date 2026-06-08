/**
 * Perplexity Sonar API LLM entegrasyonu.
 *
 * OpenAI-compatible chat completions API kullanır.
 * Recency parametresi ile arama tazeliği kontrol edilir.
 *
 * @example
 * const search = new PerplexityClient();
 * const result = await search.search({
 *   query: 'Turkey cotton export 2025 market size',
 *   recency: { months: 3, label: 'son 3 ay', description: '', perplexityParam: '3month' },
 * });
 */

import type {
  PerplexitySearchRequest,
  PerplexitySearchResponse,
  PerplexityCitation,
  PerplexityMessage,
  PerplexityModel,
  PerplexityConfig,
  PerplexityRecency,
} from './types';
import { DEFAULT_PERPLEXITY_CONFIG } from './types';
import type { RecencyWindow } from '../gtip/fact-sheet-types';

export class PerplexityClient {
  private config: PerplexityConfig;

  constructor(config?: Partial<PerplexityConfig>) {
    this.config = {
      ...DEFAULT_PERPLEXITY_CONFIG,
      ...config,
      apiKey: config?.apiKey ?? this.resolveApiKey(),
    };

    if (!this.config.apiKey) {
      console.warn(
        '[perplexity] PERPLEXITY_API_KEY bulunamadı. ' +
        '.env.local\'e PERPLEXITY_API_KEY ekleyin veya apiKey parametresi geçin.'
      );
    }
  }

  private resolveApiKey(): string | undefined {
    return (
      process.env.PERPLEXITY_API_KEY ??
      process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY ??
      undefined
    );
  }

  /**
   * Recency parametresini Perplexity formatına çevirir.
   *
   * RecencyWindow → month:3
   * "month:3" string → aynen geçer
   * "3month" string → month:3
   */
  toPerplexityRecency(recency: PerplexityRecency | RecencyWindow | undefined): string | undefined {
    if (!recency) return undefined;
    if (typeof recency === 'string') {
      // "3month" → "month:3"
      const match = recency.match(/^(\d+)(month)$/);
      if (match) return `${match[2]}:${match[1]}`;
      return recency;
    }

    if (recency.perplexityParam) {
      const match = recency.perplexityParam.match(/^(\d+)(month)$/);
      if (match) return `${match[2]}:${match[1]}`;
      return recency.perplexityParam;
    }

    return `month:${recency.months}`;
  }

  /**
   * Perplexity Sonar API ile arama yapar.
   */
  async search(request: PerplexitySearchRequest): Promise<PerplexitySearchResponse> {
    const {
      query,
      model = this.config.defaultModel,
      recency,
      maxTokens = 1024,
      temperature = 0.2,
      systemPrompt,
    } = request;

    if (!this.config.apiKey) {
      throw new Error('Perplexity API key bulunamadı. PERPLEXITY_API_KEY ayarlayın.');
    }

    const messages: PerplexityMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: query });

    const body: Record<string, unknown> = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    const recencyParam = this.toPerplexityRecency(recency);
    if (recencyParam) {
      body.search_recency = recencyParam;
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Perplexity API hatası (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();

    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? '';

    const citations: PerplexityCitation[] = (data.citations ?? []).map(
      (url: string, i: number) => ({
        url,
        title: data.citation_titles?.[i] ?? url,
      })
    );

    return {
      content,
      citations,
      model: data.model ?? model,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    };
  }

  /**
   * Kısayol: query + category ile recency otomatik belirlenir.
   */
  async searchWithCategory(
    query: string,
    category: string | null | undefined,
    options?: {
      model?: PerplexityModel;
      systemPrompt?: string;
      months?: number;
    }
  ): Promise<PerplexitySearchResponse> {
    const { getRecencyWindow } = await import('../gtip/recency');
    const window = getRecencyWindow(category);

    return this.search({
      query,
      model: options?.model,
      recency: options?.months
        ? { months: options.months, label: '', description: '', perplexityParam: `${options.months}month` }
        : window,
      systemPrompt: options?.systemPrompt,
    });
  }

  getConfig(): Omit<PerplexityConfig, 'apiKey'> & { hasApiKey: boolean } {
    return {
      baseUrl: this.config.baseUrl,
      defaultModel: this.config.defaultModel,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      hasApiKey: !!this.config.apiKey,
    };
  }
}

let defaultInstance: PerplexityClient | null = null;

export function getPerplexityClient(config?: Partial<PerplexityConfig>): PerplexityClient {
  if (!defaultInstance || config) {
    defaultInstance = new PerplexityClient(config);
  }
  return defaultInstance;
}
