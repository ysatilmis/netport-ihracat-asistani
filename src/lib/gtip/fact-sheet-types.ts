// Fakt-Sayfası (Fact Sheet) tip tanımları — Grounding Fact Sheet sistemi için

/** Fakt sayfası tipi — hangi tür bilgiyi içerdiğini belirtir */
export type FactSheetType =
  | 'market-overview'
  | 'trade-data'
  | 'trends'
  | 'regulations'
  | 'competitive';

/** Fakt sayfası bölümü — yapılandırılmış bilgi bloğu */
export interface FactSheetSection {
  id: string;
  title: string;
  type: FactSheetType;
  content: string;
  confidence: number;
  sources: string[];
  generatedAt: string;
}

/** Fakt sayfası — GTİP kodu için grounding bilgi kartı */
export interface FactSheet {
  gtipCode: string;
  gtipDescription: string;
  category: string;
  type: FactSheetType;
  sections: FactSheetSection[];
  metadata: FactSheetMetadata;
  generatedAt: string;
}

/** Fakt sayfası metadata */
export interface FactSheetMetadata {
  model: string;
  recencyWindow: RecencyWindow;
  totalTokens: number;
  executionTimeMs: number;
  error?: string;
}

/** Recency penceresi — verinin ne kadar güncel olması gerektiği */
export interface RecencyWindow {
  months: number;
  label: string;
  description: string;
  perplexityParam: string;
}

/** Fakt sayfası yapılandırması */
export interface FactSheetConfig {
  type: FactSheetType;
  title: string;
  description: string;
  requiredSections: string[];
  maxLength: number;
  refreshPriority: RefreshPriority;
}

/** Yenileme önceliği */
export type RefreshPriority = 'daily' | 'weekly' | 'monthly' | 'quarterly';

/** Tazelik önem seviyesi */
export type RecencySeverity = 'high' | 'medium' | 'low';

/** Kategori-tabanlı recency mapping */
export interface CategoryRecencyMap {
  categories: string[];
  window: RecencyWindow;
  severity: RecencySeverity;
  reasoning: string;
}

/** Tüm fakt sayfası tipleri için yapılandırma */
export const FACT_SHEET_CONFIGS: Record<FactSheetType, FactSheetConfig> = {
  'market-overview': {
    type: 'market-overview',
    title: 'Pazar Genel Bakış',
    description: 'GTİP kodu için pazar büyüklüğü, talep trendi ve fırsat analizi',
    requiredSections: ['pazar-buyuklugu', 'talep-trendi', 'firsat-analizi'],
    maxLength: 1500,
    refreshPriority: 'monthly',
  },
  'trade-data': {
    type: 'trade-data',
    title: 'Ticaret Verileri',
    description: 'İhracat/ithalat hacmi, büyüme oranları ve ülke dağılımı',
    requiredSections: ['ihracat-hacmi', 'ithalat-hacmi', 'buyume-orani', 'ulke-dagilimi'],
    maxLength: 2000,
    refreshPriority: 'monthly',
  },
  trends: {
    type: 'trends',
    title: 'Trendler',
    description: 'Fiyat trendleri, teknolojik gelişmeler ve tüketici eğilimleri',
    requiredSections: ['fiyat-trendi', 'teknoloji', 'tuketici-egilimi'],
    maxLength: 1500,
    refreshPriority: 'weekly',
  },
  regulations: {
    type: 'regulations',
    title: 'Düzenlemeler',
    description: 'GTİP koduna özel gümrük vergileri, kotalar ve mevzuat değişiklikleri',
    requiredSections: ['gumruk-vergisi', 'kota', 'mevzuat'],
    maxLength: 1000,
    refreshPriority: 'quarterly',
  },
  competitive: {
    type: 'competitive',
    title: 'Rekabet Analizi',
    description: 'Rakip ülkelerin ihracat performansı ve pazar payı karşılaştırması',
    requiredSections: ['rakip-ulkeler', 'pazar-payi', 'fiyat-karsilastirmasi'],
    maxLength: 1500,
    refreshPriority: 'monthly',
  },
};

/** Fakt sayfası tipi açıklamaları (Türkçe, kullanıcıya gösterilir) */
export const FACT_SHEET_TYPE_LABELS: Record<FactSheetType, string> = {
  'market-overview': 'Pazar Genel Bakış',
  'trade-data': 'Ticaret Verileri',
  trends: 'Trendler',
  regulations: 'Düzenlemeler',
  competitive: 'Rekabet Analizi',
};
