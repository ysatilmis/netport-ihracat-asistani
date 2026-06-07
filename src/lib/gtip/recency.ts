// Recency Helper — GTİP kategorisine göre tazelik penceresi hesaplama
import type { RecencyWindow, RefreshPriority, FactSheetType, CategoryRecencyMap } from './fact-sheet-types';

/**
 * Kategori → recency mapping tablosu.
 * Her kategori için:
 * - months: Perplexity'ye kaç aylık veri sorulacağı
 * - label: Türkçe görünen ad
 * - description: Neden bu aralık seçildi
 * - perplexityParam: Perplexity API'sine gidecek parametre
 */
const CATEGORY_RECENCY: CategoryRecencyMap[] = [
  {
    categories: ['elektronik', 'bilgisayar', 'telefon', 'tv', 'yazilim'],
    window: { months: 3, label: 'son 3 ay', description: 'Hızlı teknoloji değişimi', perplexityParam: '3month' },
    severity: 'high',
    reasoning: 'Teknoloji ürünlerinde fiyat ve talep hızla değişir',
  },
  {
    categories: ['hazir-giyim', 'tekstil', 'moda', 'ayakkabi'],
    window: { months: 3, label: 'son 3 ay', description: 'Mevsimsel moda değişimi', perplexityParam: '3month' },
    severity: 'high',
    reasoning: 'Moda ve tekstilde mevsimsel trendler belirleyicidir',
  },
  {
    categories: ['kimyasal', 'plastik', 'boya', 'kozmetik'],
    window: { months: 6, label: 'son 6 ay', description: 'Düzenli güncellenen kimyasal piyasası', perplexityParam: '6month' },
    severity: 'medium',
    reasoning: 'Kimyasal fiyatları hammadde maliyetlerine bağlı değişir',
  },
  {
    categories: ['gida', 'tarim', 'hayvancilik'],
    window: { months: 6, label: 'son 6 ay', description: 'Mevsimsel tarım ürünleri döngüsü', perplexityParam: '6month' },
    severity: 'medium',
    reasoning: 'Tarım ürünlerinde hasat dönemleri ve yıllık döngüler',
  },
  {
    categories: ['otomotiv', 'makine', 'endustriyel'],
    window: { months: 6, label: 'son 6 ay', description: 'Endüstriyel ürünler orta vadeli', perplexityParam: '6month' },
    severity: 'medium',
    reasoning: 'Endüstriyel ürünlerde talep daha istikrarlıdır',
  },
  {
    categories: ['maden', 'metal', 'cimento', 'seramik', 'cam'],
    window: { months: 12, label: 'son 12 ay', description: 'Emtia fiyatları uzun vadeli', perplexityParam: '12month' },
    severity: 'low',
    reasoning: 'Maden ve metal fiyatları yıllık bazda değişir',
  },
  {
    categories: ['mobilya', 'orman', 'kagit'],
    window: { months: 12, label: 'son 12 ay', description: 'Orman ürünleri yavaş değişir', perplexityParam: '12month' },
    severity: 'low',
    reasoning: 'Orman ürünleri ve mobilyada talep istikrarlıdır',
  },
  {
    categories: ['savunma', 'mucevher', 'elmas'],
    window: { months: 12, label: 'son 12 ay', description: 'Özel ürünler uzun vadeli', perplexityParam: '12month' },
    severity: 'low',
    reasoning: 'Savunma ve mücevher sektörü uzun vadeli kontratlarla çalışır',
  },
];

/** Varsayılan recency — hiçbir kategori eşleşmezse */
const DEFAULT_RECENCY: RecencyWindow = {
  months: 6,
  label: 'son 6 ay',
  description: 'Varsayılan orta vadeli veri',
  perplexityParam: '6month',
};

/**
 * GTİP kategorisine göre recency penceresi döndürür.
 *
 * @example
 * getRecencyWindow('elektronik') // { months: 3, label: 'son 3 ay', ... }
 * getRecencyWindow('gida')       // { months: 6, label: 'son 6 ay', ... }
 * getRecencyWindow('bilinmeyen') // { months: 6, ... } (varsayılan)
 */
export function getRecencyWindow(category: string | null | undefined): RecencyWindow {
  if (!category || typeof category !== 'string') {
    return { ...DEFAULT_RECENCY };
  }

  const normalized = category.toLowerCase().trim();

  for (const entry of CATEGORY_RECENCY) {
    if (entry.categories.some(c => c === normalized || c.includes(normalized) || normalized.includes(c))) {
      return { ...entry.window };
    }
  }

  return { ...DEFAULT_RECENCY };
}

/**
 * Fakt sayfası tipine göre de recency penceresi döndürür.
 * Tip bazlı override — trade-data her zaman daha güncel olmalı.
 *
 * @example
 * getTypeRecency('trade-data') // { months: 1, label: 'son 1 ay', ... }
 */
export function getTypeRecency(type: FactSheetType): RecencyWindow {
  switch (type) {
    case 'trade-data':
      return { months: 1, label: 'son 1 ay', description: 'Ticaret verileri güncel olmalı', perplexityParam: '1month' };
    case 'trends':
      return { months: 3, label: 'son 3 ay', description: 'Trendler hızlı değişir', perplexityParam: '3month' };
    case 'market-overview':
      return { months: 6, label: 'son 6 ay', description: 'Pazar verileri orta vadeli', perplexityParam: '6month' };
    case 'regulations':
      return { months: 12, label: 'son 12 ay', description: 'Mevzuat yavaş değişir', perplexityParam: '12month' };
    case 'competitive':
      return { months: 6, label: 'son 6 ay', description: 'Rekabet verileri orta vadeli', perplexityParam: '6month' };
  }
}

/**
 * Kategori için en uygun recency penceresini döndürür.
 * Önce kategori bazlı, sonra tip bazlı override uygular.
 * Hangisi daha kısaysa (daha güncel) onu kullanır.
 */
export function getEffectiveRecency(
  category: string | null | undefined,
  type: FactSheetType
): RecencyWindow {
  const categoryWindow = getRecencyWindow(category);
  const typeWindow = getTypeRecency(type);

  // Hangisi daha kısa (daha taze) ise onu kullan
  if (typeWindow.months < categoryWindow.months) {
    return { ...typeWindow, description: `${typeWindow.description} (tip bazlı)` };
  }
  return { ...categoryWindow, description: `${categoryWindow.description} (kategori bazlı)` };
}

/**
 * Kategori için Perplexity API'sine gönderilecek recency parametresini döndürür.
 *
 * @example
 * getRecencyParameter('elektronik') // 'month:3'
 * getRecencyParameter('maden')      // 'month:12'
 */
export function getRecencyParameter(
  category: string | null | undefined,
  type?: FactSheetType
): string {
  if (type) {
    const effective = getEffectiveRecency(category, type);
    return effective.perplexityParam;
  }
  const window = getRecencyWindow(category);
  return window.perplexityParam;
}

/**
 * Kategori için yenileme önceliğini döndürür.
 *
 * @example
 * getRefreshPriority('elektronik') // 'weekly'
 * getRefreshPriority('maden')      // 'quarterly'
 */
export function getRefreshPriority(category: string | null | undefined): RefreshPriority {
  if (!category || typeof category !== 'string') return 'monthly';

  const normalized = category.toLowerCase().trim();

  for (const entry of CATEGORY_RECENCY) {
    if (entry.categories.some(c => c === normalized || normalized.includes(c) || c.includes(normalized))) {
      if (entry.window.months <= 3) return 'weekly';
      if (entry.window.months <= 6) return 'monthly';
      return 'quarterly';
    }
  }

  return 'monthly';
}

/**
 * Tazelik önem seviyesini döndürür.
 */
export function getRecencySeverity(category: string | null | undefined): string {
  if (!category || typeof category !== 'string') return 'medium';

  const normalized = category.toLowerCase().trim();

  for (const entry of CATEGORY_RECENCY) {
    if (entry.categories.some(c => c === normalized || normalized.includes(c) || c.includes(normalized))) {
      return entry.severity;
    }
  }

  return 'medium';
}
