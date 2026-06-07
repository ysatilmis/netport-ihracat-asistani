/**
 * Fakt-Sayfası Builder — GTİP kodu için grounding bilgi kartı oluşturur.
 *
 * Akış:
 * 1. GTİP kodunu çözümle
 * 2. Kategori + tip → recency penceresi belirle
 * 3. Her bölüm için arama sorgusu oluştur
 * 4. Perplexity ile paralel araştırma
 * 5. Sonuçları yapılandırılmış FactSheet'e dönüştür
 */

import type {
  FactSheet,
  FactSheetSection,
  FactSheetType,
  FactSheetMetadata,
} from './fact-sheet-types';
import { FACT_SHEET_CONFIGS } from './fact-sheet-types';
import { resolveGtipCode, describeGtip } from './resolver';
import type { GtipResolveResult } from './types';
import { getEffectiveRecency } from './recency';
import type { RecencyWindow } from './fact-sheet-types';
import { generateText } from 'ai';
import { openrouter } from '@/lib/llm';

/** Builder girdisi */
export interface FactSheetBuilderInput {
  /** GTİP kodu (6-, 8-, 12-haneli) */
  gtipCode: string;
  /** Ürün kategorisi (opsiyonel — shortcut'tan çıkarılır) */
  category?: string;
  /** Fakt sayfası tipi */
  type: FactSheetType;
  /** Perplexity modeli (opsiyonel) */
  model?: string;
  /** Özel sistem promptu (opsiyonel) */
  systemPrompt?: string;
}

/** Builder çıktısı — FactSheet + execution detayları */
export interface FactSheetBuilderResult {
  factSheet: FactSheet;
  execution: {
    startTime: number;
    endTime: number;
    durationMs: number;
    totalTokens: number;
    searchCount: number;
    successCount: number;
    errorCount: number;
    errors: string[];
  };
}

/**
 * Her fakt sayfası tipi için arama sorguları oluşturur.
 * Ürün adı ve kategoriye göre kişiselleştirilmiş İngilizce sorgular.
 */
function buildSearchQueries(
  type: FactSheetType,
  productName: string,
  gtipCode: string,
  category: string
): string[] {
  const formattedCode = `${gtipCode.substring(0, 4)}.${gtipCode.substring(4, 6)}`;
  const base = `${productName} (HS Code ${formattedCode}) Turkey`;

  const QUERIES: Record<FactSheetType, string[]> = {
    'market-overview': [
      `${base} export market size revenue 2025 2026 analysis`,
      `${base} demand trends growth opportunities`,
      `${base} top importing countries trade value`,
    ],
    'trade-data': [
      `${base} export volume value 2024 2025 statistics`,
      `${base} import data Turkey customs statistics`,
      `${base} trade balance yearly comparison`,
    ],
    trends: [
      `${base} price trends 2025 2026 forecast`,
      `${base} technological developments innovation`,
      `${base} consumer preferences shifting trends`,
    ],
    regulations: [
      `${base} customs duty tariff rate 2025`,
      `${base} export regulations Turkey requirements`,
      `${base} trade agreement EU customs union`,
    ],
    competitive: [
      `${base} main exporting countries competitors`,
      `${base} global market share analysis comparison`,
      `${base} competitive advantage pricing analysis`,
    ],
  };

  return QUERIES[type] ?? QUERIES['market-overview'];
}

/**
 * Ham Perplexity yanıtını yapılandırılmış FactSheetSection'a dönüştürür.
 */
function createSection(
  id: string,
  title: string,
  type: FactSheetType,
  content: string,
  sources: string[]
): FactSheetSection {
  return {
    id,
    title,
    type,
    content,
    confidence: content ? 0.8 : 0,
    sources: sources ?? [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Varsayılan section içeriği — Perplexity çağrısı başarısız olursa kullanılır.
 */
function getDefaultSectionContent(sectionId: string): string {
  const defaults: Record<string, string> = {
    'pazar-buyuklugu': 'Pazar büyüklüğü verileri şu anda alınamadı. Lütfen daha sonra tekrar deneyin.',
    'talep-trendi': 'Talep trendi verileri şu anda alınamadı.',
    'firsat-analizi': 'Fırsat analizi şu anda yapılamadı.',
    'ihracat-hacmi': 'İhracat hacmi verileri şu anda alınamadı.',
    'ithalat-hacmi': 'İthalat hacmi verileri şu anda alınamadı.',
    'buyume-orani': 'Büyüme oranı verileri şu anda alınamadı.',
    'ulke-dagilimi': 'Ülke dağılımı verileri şu anda alınamadı.',
    'fiyat-trendi': 'Fiyat trendi verileri şu anda alınamadı.',
    'teknoloji': 'Teknolojik gelişme verileri şu anda alınamadı.',
    'tuketici-egilimi': 'Tüketici eğilimi verileri şu anda alınamadı.',
    'gumruk-vergisi': 'Gümrük vergisi verileri şu anda alınamadı.',
    'kota': 'Kota verileri şu anda alınamadı.',
    'mevzuat': 'Mevzuat verileri şu anda alınamadı.',
    'rakip-ulkeler': 'Rakip ülke verileri şu anda alınamadı.',
    'pazar-payi': 'Pazar payı verileri şu anda alınamadı.',
    'fiyat-karsilastirmasi': 'Fiyat karşılaştırması verileri şu anda alınamadı.',
  };
  return defaults[sectionId] ?? 'Veri şu anda alınamadı.';
}

/**
 * Fakt sayfası oluşturur.
 *
 * @example
 * const builder = new FactSheetBuilder();
 * const result = await builder.build({
 *   gtipCode: '520100',
 *   category: 'tekstil',
 *   type: 'market-overview',
 * });
 */
export class FactSheetBuilder {
  /**
   * Perplexity client veya search fonksiyonu.
   * Dışarıdan enjekte edilebilir (test/mock için).
   */
  private searchFn: ((query: string, recency: RecencyWindow) => Promise<{
    content: string;
    citations: { url: string; title?: string }[];
    usage: { totalTokens: number };
  }>) | null = null;

  /**
   * Özel search fonksiyonu atar. Atanmazsa PerplexityClient kullanılır.
   */
  setSearchFunction(
    fn: (query: string, recency: RecencyWindow) => Promise<{
      content: string;
      citations: { url: string; title?: string }[];
      usage: { totalTokens: number };
    }>
  ): void {
    this.searchFn = fn;
  }

  /**
   * Varsayılan search fonksiyonu — PerplexityClient kullanır.
   */
  private async defaultSearch(
    query: string,
    recency: RecencyWindow
  ): Promise<{
    content: string;
    citations: { url: string; title?: string }[];
    usage: { totalTokens: number };
  }> {
    const result = await generateText({
      model: openrouter('perplexity/sonar-pro'),
      messages: [{ role: 'user', content: query }],
      temperature: 0.2,
      maxOutputTokens: 512,
      providerOptions: {
        openrouter: { search_recency_filter: recency.perplexityParam ?? 'year' },
      },
    });
    return {
      content: result.text,
      citations: [],
      usage: { totalTokens: result.usage?.totalTokens ?? 0 },
    };
  }

  /**
   * FactSheet oluşturur.
   */
  async build(input: FactSheetBuilderInput): Promise<FactSheetBuilderResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    // 1. GTİP kodunu çözümle
    const resolved = resolveGtipCode(input.gtipCode);
    if (!resolved) {
      const validation = describeGtip(input.gtipCode);
      throw new Error(
        `Geçersiz GTİP kodu: ${input.gtipCode}. ` +
        (validation.validation.errors.join('; ') || 'Kod bulunamadı.')
      );
    }

    const productName = resolved.description;
    const category = input.category ?? this.inferCategory(resolved);

    // 2. Recency penceresini belirle
    const effectiveRecency = getEffectiveRecency(category, input.type);

    // 3. Arama sorgularını oluştur
    const queries = buildSearchQueries(
      input.type,
      productName,
      resolved.code,
      category
    );

    // 4. Perplexity aramaları yap
    const config = FACT_SHEET_CONFIGS[input.type];
    const sections: FactSheetSection[] = [];
    let totalTokens = 0;
    let searchCount = 0;
    let successCount = 0;
    let errorCount = 0;

    const searchFn = this.searchFn ?? this.defaultSearch.bind(this);

    // Her required section için bir arama yap
    for (let i = 0; i < config.requiredSections.length; i++) {
      const sectionId = config.requiredSections[i];
      const query = queries[i] ?? queries[0];
      searchCount++;

      try {
        const result = await searchFn(query, effectiveRecency);
        totalTokens += result.usage.totalTokens;

        sections.push(
          createSection(
            sectionId,
            this.getSectionTitle(sectionId),
            input.type,
            result.content,
            result.citations.map(c => c.url)
          )
        );
        successCount++;
      } catch (err) {
        errorCount++;
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`[${sectionId}] ${message}`);

        sections.push(
          createSection(
            sectionId,
            this.getSectionTitle(sectionId),
            input.type,
            getDefaultSectionContent(sectionId),
            []
          )
        );
      }
    }

    const endTime = Date.now();

    // 5. Metadata
    const metadata: FactSheetMetadata = {
      model: input.model ?? 'sonar-pro',
      recencyWindow: effectiveRecency,
      totalTokens,
      executionTimeMs: endTime - startTime,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };

    // 6. FactSheet
    const factSheet: FactSheet = {
      gtipCode: resolved.code,
      gtipDescription: productName,
      category,
      type: input.type,
      sections,
      metadata,
      generatedAt: new Date().toISOString(),
    };

    return {
      factSheet,
      execution: {
        startTime,
        endTime,
        durationMs: endTime - startTime,
        totalTokens,
        searchCount,
        successCount,
        errorCount,
        errors,
      },
    };
  }

  /**
   * Kategorisi belirtilmemişse GTİP kodunun bölümünden çıkar.
   */
  private inferCategory(resolved: GtipResolveResult): string {
    const section = resolved.section;
    if (section.includes('Tekstil')) return 'tekstil';
    if (section.includes('Gıda') || section.includes('Bitkisel') || section.includes('Hayvansal')) return 'gida';
    if (section.includes('Maden')) return 'maden';
    if (section.includes('Metal')) return 'metal';
    if (section.includes('Makine')) return 'makine';
    if (section.includes('Taşıt')) return 'otomotiv';
    if (section.includes('Kimya') || section.includes('Kauçuk')) return 'kimyasal';
    if (section.includes('Plastik')) return 'plastik';
    if (section.includes('Ağaç')) return 'orman';
    if (section.includes('Kağıt')) return 'kagit';
    return 'genel';
  }

  /**
   * Section ID → Türkçe başlık
   */
  private getSectionTitle(sectionId: string): string {
    const titles: Record<string, string> = {
      'pazar-buyuklugu': 'Pazar Büyüklüğü',
      'talep-trendi': 'Talep Trendi',
      'firsat-analizi': 'Fırsat Analizi',
      'ihracat-hacmi': 'İhracat Hacmi',
      'ithalat-hacmi': 'İthalat Hacmi',
      'buyume-orani': 'Büyüme Oranı',
      'ulke-dagilimi': 'Ülke Dağılımı',
      'fiyat-trendi': 'Fiyat Trendi',
      'teknoloji': 'Teknolojik Gelişmeler',
      'tuketici-egilimi': 'Tüketici Eğilimleri',
      'gumruk-vergisi': 'Gümrük Vergisi',
      'kota': 'Kota',
      'mevzuat': 'Mevzuat',
      'rakip-ulkeler': 'Rakip Ülkeler',
      'pazar-payi': 'Pazar Payı',
      'fiyat-karsilastirmasi': 'Fiyat Karşılaştırması',
    };
    return titles[sectionId] ?? sectionId;
  }
}
