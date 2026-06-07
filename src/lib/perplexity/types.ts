// Perplexity Sonar API tip tanımları
import type { RecencyWindow } from '../gtip/fact-sheet-types';

/** Perplexity Sonar modelleri */
export type PerplexityModel = 'sonar' | 'sonar-pro' | 'sonar-deep-research';

/** Perplexity search recency formatı */
export type PerplexityRecency = `month:${number}` | 'year:2026' | string;

/** Perplexity search isteği */
export interface PerplexitySearchRequest {
  query: string;
  model?: PerplexityModel;
  recency?: PerplexityRecency | RecencyWindow;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/** Perplexity search yanıtı — citation adresi */
export interface PerplexityCitation {
  url: string;
  title?: string;
}

/** Perplexity search yanıtı */
export interface PerplexitySearchResponse {
  content: string;
  citations: PerplexityCitation[];
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Perplexity search hatası */
export interface PerplexityError {
  code: string;
  message: string;
  status: number;
}

/** Yapılandırma */
export interface PerplexityConfig {
  apiKey?: string;
  baseUrl: string;
  defaultModel: PerplexityModel;
  timeout: number;
  maxRetries: number;
}

export const DEFAULT_PERPLEXITY_CONFIG: PerplexityConfig = {
  baseUrl: 'https://api.perplexity.ai',
  defaultModel: 'sonar-pro',
  timeout: 30000,
  maxRetries: 2,
};

/** Perplexity message formatı (OpenAI-compatible) */
export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
