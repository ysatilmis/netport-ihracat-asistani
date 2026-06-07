/**
 * Prompt Cerrahisi — GTİP raporlama sistemi için LLM prompt template'leri.
 *
 * Task 8: report-prompts — ihracat raporu oluşturma
 * Task 9: positioning + extract-countries — konumlandırma ve ülke çıkarma
 */

import type { PromptContext } from './prompt-context';
import { renderFactSheetSummary } from './render';

// ──────────────────────────────────────────────
// Task 8: REPORT PROMPTS
// ──────────────────────────────────────────────

/**
 * Rapor asistanı system prompt'u.
 */
export function buildReportSystemPrompt(): string {
  return `Sen profesyonel bir uluslararası ticaret analistisin.
Görevin GTİP (HS Code) bazlı ihracat raporları hazırlamak.

## Uzmanlık Alanların
- Pazar büyüklüğü ve talep analizi
- İhracat/ithalat verileri yorumlama
- Rekabet analizi ve pazar konumlandırması
- Gümrük vergileri ve ticaret düzenlemeleri
- Trend ve fiyat tahminleri

## Rapor Yazma Kuralları
1. **Veri odaklı ol:** Somut rakamlar, yüzdeler ve tarihler kullan
2. **Kısa ve öz yaz:** Gereksiz dolgu cümleler yasak
3. **Türkçe yaz:** Tüm rapor Türkçe, profesyonel üslup
4. **Kaynak belirt:** Mümkünse verinin kaynağını ekle
5. **Belirsiz ifadeler kullanma:** "olabilir", "muhtemelen" gibi kelimeler yasak
6. **Aksiyon odaklı ol:** Her analizin sonunda somut öneri ver`;
}

/**
 * Rapor format talimatları.
 */
export function getReportFormatInstructions(): string {
  return `## Çıktı Formatı

Aşağıdaki bölümleri kullan, her bölüm ZORUNLU:

### 1. Yönetici Özeti
2-3 cümle, en önemli bulgular

### 2. Pazar Büyüklüğü ve Talep
Mevcut pazar büyüklüğü, büyüme oranı, talep trendleri

### 3. Rekabet Analizi
Başlıca ihracatçı ülkeler, pazar payları, rekabet avantajı

### 4. Fırsatlar ve Riskler
En önemli 2 fırsat ve 2 risk

### 5. Stratejik Öneriler
3 somut aksiyon önerisi`;
}

/**
 * Rapor prompt'u — PromptContext'ten kullanıcı mesajı oluşturur.
 *
 * @example
 * const userPrompt = buildReportUserPrompt(ctx);
 */
export function buildReportUserPrompt(ctx: PromptContext): string {
  const parts: string[] = [];

  parts.push(`## Görev`);
  parts.push(
    ctx.userQuery
      ? `Kullanıcının sorusu: "${ctx.userQuery}"`
      : `${ctx.gtipDescription} (GTİP: ${formatGtip(ctx.gtipCode)}) için ihracat raporu hazırla.`
  );
  parts.push('');

  // GTİP bilgisi
  parts.push('## GTİP Bilgisi');
  parts.push(`- Kod: ${formatGtip(ctx.gtipCode)}`);
  parts.push(`- Ürün: ${ctx.gtipDescription}`);
  parts.push(`- Kategori: ${ctx.category}`);
  parts.push(`- Veri Tazeliği: ${ctx.recencyLabel}`);
  if (ctx.targetCountry) {
    parts.push(`- Hedef Ülke: ${ctx.targetCountry}`);
  }
  parts.push('');

  // Grounding verisi
  if (ctx.factSheet) {
    parts.push('## Grounding Verisi');
    parts.push(renderFactSheetSummary(ctx.factSheet));
    parts.push('Detaylı grounding verisi için fakt sayfası bölümlerine bak.');
    parts.push('');
  }

  // Ek talimatlar
  if (ctx.extraInstructions) {
    parts.push('## Ek Talimatlar');
    parts.push(ctx.extraInstructions);
    parts.push('');
  }

  parts.push('Raporu yukarıdaki çıktı formatına uygun şekilde hazırla.');
  parts.push('');

  return parts.join('\n');
}

/**
 * Tam grounding verisiyle zenginleştirilmiş rapor prompt'u.
 * FactSheet'in tüm bölümlerini prompt'a ekler.
 */
export function buildRichReportUserPrompt(ctx: PromptContext, factSheetMarkdown: string): string {
  const parts: string[] = [];

  parts.push(`## Görev`);
  parts.push(
    ctx.userQuery
      ? `Kullanıcının sorusu: "${ctx.userQuery}"`
      : `${ctx.gtipDescription} (GTİP: ${formatGtip(ctx.gtipCode)}) için ihracat raporu hazırla.`
  );
  parts.push('');

  parts.push('## Aşağıdaki grounding verisini kullanarak rapor hazırla');
  parts.push('');
  parts.push(factSheetMarkdown);
  parts.push('');

  parts.push(getReportFormatInstructions());

  return parts.join('\n');
}

// ──────────────────────────────────────────────
// Task 9: POSITIONING
// ──────────────────────────────────────────────

/**
 * Rekabet konumlandırması prompt'u.
 * Ürünün hangi ülkelerde rekabet avantajı olduğunu analiz eder.
 */
export function buildPositioningPrompt(ctx: PromptContext): string {
  const parts: string[] = [];

  parts.push(`Sen bir uluslararası ticaret stratejistisin.
Aşağıdaki GTİP kodu için Türkiye'nin rekabet konumlandırmasını analiz et.`);
  parts.push('');

  parts.push(`## Ürün Bilgisi`);
  parts.push(`- GTİP: ${formatGtip(ctx.gtipCode)}`);
  parts.push(`- Ürün: ${ctx.gtipDescription}`);
  parts.push(`- Kategori: ${ctx.category}`);
  if (ctx.targetCountry) {
    parts.push(`- Hedef Pazar: ${ctx.targetCountry}`);
  }
  parts.push('');

  parts.push(`## Analiz Başlıkları`);
  parts.push(`1. Türkiye'nin bu üründe küresel rekabet gücü (1-10 skalasında)`);
  parts.push(`2. En güçlü rakip ülkeler (en fazla 3)`);
  parts.push(`3. Türkiye'nin rekabet avantajı (maliyet, kalite, lojistik, vs.)`);
  parts.push(`4. Büyüme potansiyeli olan hedef pazarlar (en fazla 5 ülke)`);
  parts.push(`5. Pazara giriş stratejisi önerisi`);

  if (ctx.factSheet) {
    parts.push('');
    parts.push(`Grounding verisi: ${renderFactSheetSummary(ctx.factSheet)}`);
  }

  parts.push('');
  parts.push(`Her madde için 1-2 cümle, somut veriye dayalı.`);

  return parts.join('\n');
}

/**
 * Pazara giriş prompt'u — belirli bir ülke için.
 */
export function buildMarketEntryPrompt(ctx: PromptContext, targetCountry: string): string {
  const parts: string[] = [];

  parts.push(`Sen bir ihracat danışmanısın.
${ctx.gtipDescription} (GTİP: ${formatGtip(ctx.gtipCode)}) ürününün ${targetCountry} pazarına giriş stratejisini hazırla.`);
  parts.push('');

  parts.push(`## Analiz Başlıkları`);
  parts.push(`1. Pazar büyüklüğü ve talep (${targetCountry} için)`);
  parts.push(`2. Gümrük vergileri ve ticaret engelleri`);
  parts.push(`3. Lojistik ve dağıtım kanalları`);
  parts.push(`4. Rakip ürün fiyatları`);
  parts.push(`5. Pazara giriş için 3 somut adım`);

  return parts.join('\n');
}

// ──────────────────────────────────────────────
// Task 9: EXTRACT COUNTRIES
// ──────────────────────────────────────────────

/**
 * Metinden ülke isimlerini çıkarmak için prompt.
 * LLM'den sadece ülke listesi dönmesini ister.
 */
export function buildExtractCountriesPrompt(text: string): string {
  return `Aşağıdaki metinde geçen tüm ülke isimlerini bul.
Sadece virgülle ayrılmış ülke isimlerini listele, ekstra açıklama yapma.

Format: Ülke1, Ülke2, Ülke3

Metin:
"""
${text}
"""`;
}

/**
 * LLM'in ülke çıkarma yanıtını parse eder.
 * Çeşitli formatları dener:
 * - "Türkiye, Almanya, ABD"
 * - "- Türkiye\n- Almanya"
 * - ["Türkiye", "Almanya"]
 *
 * @example
 * parseExtractedCountries('Türkiye, Almanya, ABD') // ['Türkiye', 'Almanya', 'ABD']
 * parseExtractedCountries('- Türkiye\n- Almanya')  // ['Türkiye', 'Almanya']
 */
export function parseExtractedCountries(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];

  // JSON array format dene
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => typeof item === 'string' && item.trim());
    }
  } catch {
    // JSON değil, devam et
  }

  // Normalize: trim, boş satırları temizle
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // "-" liste formatı
  if (lines.some(l => l.startsWith('-'))) {
    return lines
      .filter(l => l.startsWith('-'))
      .map(l => l.replace(/^-\s*/, '').trim())
      .filter(l => l.length > 0 && !l.startsWith('['));
  }

  // "1. " numaralı liste formatı
  if (lines.some(l => /^\d+[.)\s]/.test(l))) {
    return lines
      .map(l => l.replace(/^\d+[.)\s]+/, '').trim())
      .filter(l => l.length > 0 && !l.startsWith('['));
  }

  // Virgülle ayrılmış liste
  if (lines.length === 1 && lines[0].includes(',')) {
    return lines[0]
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // Her satır bir ülke
  return lines.filter(l => {
    // "gibi" ifadeleri filtrele
    if (/^(ve|ile|gibi|örneğin|mesela|bunlar)$/i.test(l)) return false;
    return l.length > 0 && !l.startsWith('[') && !l.startsWith('{');
  });
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function formatGtip(code: string): string {
  const c = code.replace(/[.\s-]/g, '');
  if (c.length >= 6) return `${c.substring(0, 4)}.${c.substring(4, 6)}`;
  return c;
}
