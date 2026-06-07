/**
 * FactSheet render'layıcı — GTİP grounding verisini prompt-friendly markdown'a çevirir.
 *
 * Format, Claude/GPT prompt'una embedding için optimize edilmiştir:
 * - Gereksiz süsleme yok, doğrudan bilgi
 * - Her bölüm ayrı blok
 * - Kaynakçalar ayrı bölüm
 * - Token verimli
 */

import type { FactSheet, FactSheetSection, FactSheetType } from './fact-sheet-types';

/**
 * GTİP kodunu formatlar: 520100 → 5201.00
 */
function formatCode(code: string): string {
  const c = code.replace(/[.\s-]/g, '');
  if (c.length >= 6) return `${c.substring(0, 4)}.${c.substring(4, 6)}`;
  return c;
}

/**
 * Fakt sayfası tipi için emoji simgesi.
 */
function typeEmoji(type: FactSheetType): string {
  switch (type) {
    case 'market-overview': return '📊';
    case 'trade-data': return '📈';
    case 'trends': return '📉';
    case 'regulations': return '⚖️';
    case 'competitive': return '🏆';
  }
}

/**
 * Fakt sayfası tipi için Türkçe başlık.
 */
function typeLabel(type: FactSheetType): string {
  const labels: Record<FactSheetType, string> = {
    'market-overview': 'Pazar Genel Bakış',
    'trade-data': 'Ticaret Verileri',
    'trends': 'Trendler',
    'regulations': 'Düzenlemeler',
    'competitive': 'Rekabet Analizi',
  };
  return labels[type] ?? type;
}

/**
 * Tek bir FactSheetSection'ı markdown bloğuna render eder.
 *
 * @example
 * renderSectionBlock(section)
 * // "### 📊 Pazar Büyüklüğü
 * //  [content]
 * //  [kaynak: example.com]"
 */
export function renderSectionBlock(section: FactSheetSection, index: number): string {
  const lines: string[] = [];

  // Başlık
  lines.push(`### Bölüm ${index + 1}: ${section.title}`);
  lines.push('');

  // İçerik
  if (section.content) {
    lines.push(section.content);
    lines.push('');
  } else {
    lines.push('_Veri bulunamadı._');
    lines.push('');
  }

  // Kaynaklar
  if (section.sources && section.sources.length > 0) {
    const sourceList = section.sources
      .slice(0, 3) // En fazla 3 kaynak
      .map(url => `- ${url}`)
      .join('\n');
    lines.push(`**Kaynaklar:**`);
    lines.push(sourceList);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * FactSheet'in tamamını markdown bloğu olarak render eder.
 * Prompt context'te kullanılmak üzere tasarlanmıştır.
 *
 * @example
 * renderFactSheetBlock(factSheet)
 * // "## 📊 Grounding: 5201.00 — Cotton (Pazar Genel Bakış)
 * //  ...sections..."
 */
export function renderFactSheetBlock(factSheet: FactSheet): string {
  const lines: string[] = [];
  const formattedCode = formatCode(factSheet.gtipCode);
  const emoji = typeEmoji(factSheet.type);
  const label = typeLabel(factSheet.type);

  // Ana başlık
  lines.push(
    `## ${emoji} Grounding: ${formattedCode} — ${factSheet.gtipDescription} (${label})`
  );
  lines.push('');

  // Metadata satırı
  const metaParts: string[] = [
    `GTİP: ${formattedCode}`,
    `Kategori: ${factSheet.category}`,
    `Tazelik: ${factSheet.metadata.recencyWindow.label}`,
    `Model: ${factSheet.metadata.model}`,
  ];
  if (factSheet.metadata.totalTokens > 0) {
    metaParts.push(`Token: ${factSheet.metadata.totalTokens}`);
  }
  lines.push(`> ${metaParts.join(' · ')}`);
  lines.push('');

  // Bölümler
  if (factSheet.sections.length === 0) {
    lines.push('_Bu fakt sayfası için grounding verisi bulunamadı._');
    lines.push('');
  } else {
    for (let i = 0; i < factSheet.sections.length; i++) {
      lines.push(renderSectionBlock(factSheet.sections[i], i));
    }
  }

  // Hata durumu
  if (factSheet.metadata.error) {
    lines.push('---');
    lines.push(`> ⚠️ Bazı bölümler alınamadı: ${factSheet.metadata.error}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * FactSheet'in kısa özetini render eder (tek satır).
 * Prompt'a inline olarak eklenmek için.
 */
export function renderFactSheetSummary(factSheet: FactSheet): string {
  const formattedCode = formatCode(factSheet.gtipCode);
  const completedSections = factSheet.sections.filter(s => s.content && s.content.length > 0).length;
  const totalSections = factSheet.sections.length;

  return [
    `[Grounding: ${formattedCode}] ${factSheet.gtipDescription}`,
    `(${completedSections}/${totalSections} bölüm, ${factSheet.metadata.recencyWindow.label})`,
  ].join(' ');
}

/**
 * FactSheet'i JSON formatında prompt context için hazırlar.
 * LLM'in kolayca işleyebileceği yapılandırılmış formatta döndürür.
 */
export function renderFactSheetForPrompt(factSheet: FactSheet): Record<string, unknown> {
  return {
    gtip_code: factSheet.gtipCode,
    product: factSheet.gtipDescription,
    category: factSheet.category,
    report_type: factSheet.type,
    recency: factSheet.metadata.recencyWindow.label,
    sections: factSheet.sections.map(s => ({
      id: s.id,
      title: s.title,
      content: s.content,
      sources: s.sources,
    })),
    generated_at: factSheet.generatedAt,
  };
}
