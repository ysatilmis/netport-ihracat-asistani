// GTİP (HS Code) Resolver — kod çözümleme, kısayol arama, açıklama
import type { GtipResolveResult, GtipShortcut, GtipFormat, GtipConfig } from './types';
import { DEFAULT_GTIP_CONFIG } from './types';
import { GTIP_SHORTCUTS, resolveSection } from './data';
import { validateGtip, normalizeGtip, detectGtipFormat, formatGtip } from './validator';

/**
 * GTİP kodunu doğrudan çözümler.
 * Kod geçerliyse detaylı bilgi döner, geçersizse null.
 *
 * @example
 * resolveGtipCode('520100') // { code: '520100', description: 'Cotton, not carded...', ... }
 * resolveGtipCode('999999') // null (bilinmeyen kod)
 */
export function resolveGtipCode(
  code: string,
  config?: Partial<GtipConfig>
): GtipResolveResult | null {
  const validation = validateGtip(code, config);
  if (!validation.isValid) return null;

  const normalized = validation.normalizedCode;
  const format = validation.format!;
  const formatted = formatGtip(normalized);

  // Shortcut tablosundan açıklamayı bul
  const shortcut = GTIP_SHORTCUTS.find(s => s.code === normalized);
  const description = shortcut?.description ?? `GTİP Kodu ${formatted}`;

  // Bölüm bilgisi
  const sectionInfo = resolveSection(normalized);
  const section = sectionInfo?.name ?? 'Bilinmeyen Bölüm';
  const chapter = normalized.substring(0, 2);

  // Fasıl açıklaması (bölüm bazında basit)
  const heading = format === '6-digit'
    ? `${normalized.substring(0, 4)}: ${description}`
    : `${formatted}: ${description}`;

  return {
    code: normalized,
    format,
    description,
    section,
    chapter: `Fasıl ${chapter}`,
    heading,
  };
}

/**
 * Kısayol ismine göre GTİP kodu arar.
 * Case-insensitive, kısmi eşleşme destekler.
 *
 * @example
 * resolveGtipShortcut('pamuk') // { name: 'pamuk', code: '520100', ... }
 * resolveGtipShortcut('PAMUK') // aynı sonuç
 * resolveGtipShortcut('mak') // ['makarna', 'makine', 'makine parçası']
 */
export function resolveGtipShortcut(
  name: string,
  exactOnly = false
): GtipShortcut[] {
  if (!name || typeof name !== 'string') return [];

  const searchTerm = name.toLowerCase().trim();
  if (!searchTerm) return [];

  // Önce tam eşleşme
  const exact = GTIP_SHORTCUTS.filter(
    s => s.name.toLowerCase() === searchTerm
  );

  if (exactOnly) return exact;

  // Kısmi eşleşme
  const partial = GTIP_SHORTCUTS.filter(s =>
    s.name.toLowerCase().includes(searchTerm)
  );

  // Tam eşleşen varsa onları öne koy, sonra kısmi eşleşenleri ekle (tekrarsız)
  const exactNames = new Set(exact.map(s => s.name));
  const rest = partial.filter(s => !exactNames.has(s.name));

  return [...exact, ...rest];
}

/**
 * Herhangi bir girdiyi GTİP koduna çözer.
 * - Doğrudan GTİP kodu → validate + resolve
 * - Kısayol ismi → shortcut tablosu
 * - Geçersiz → boş dizi
 *
 * @example
 * resolveGtip('520100') // [{ code: '520100', ... }]
 * resolveGtip('pamuk') // [{ code: '520100', ... }]
 * resolveGtip('xyz') // []
 */
export function resolveGtip(
  input: string,
  config?: Partial<GtipConfig>
): GtipResolveResult[] {
  if (!input || typeof input !== 'string') return [];

  const trimmed = input.trim();
  if (!trimmed) return [];

  // 1. Önce doğrudan GTİP kodu olarak dene
  const normalized = normalizeGtip(trimmed);
  if (/^\d{4,14}$/.test(normalized)) {
    const result = resolveGtipCode(trimmed, config);
    if (result) return [result];
  }

  // 2. Kısayol olarak dene
  const shortcuts = resolveGtipShortcut(trimmed, false);
  if (shortcuts.length > 0) {
    // Her shortcut'ı resolve et
    return shortcuts
      .map(s => resolveGtipCode(s.code, config))
      .filter((r): r is GtipResolveResult => r !== null);
  }

  // 3. Kod formatındaysa ama geçerli değilse boş
  if (/^\d{4,14}$/.test(normalized)) return [];

  // 4. Hiçbir şey bulunamadı
  return [];
}

/**
 * GTİP kodu için insan tarafından okunabilir açıklama üretir.
 *
 * @example
 * explainGtip('520100')
 * // "GTİP 5201.00: Pamuk (Bölüm XI: Tekstil ve Tekstil Eşyası, Fasıl 52)"
 */
export function explainGtip(code: string, config?: Partial<GtipConfig>): string {
  const validation = validateGtip(code, config);
  if (!validation.isValid) {
    return `Geçersiz GTİP kodu: ${validation.errors.join('; ')}`;
  }

  const normalized = validation.normalizedCode;
  const formatted = formatGtip(normalized);
  const shortcut = GTIP_SHORTCUTS.find(s => s.code === normalized);
  const sectionInfo = resolveSection(normalized);
  const chapter = normalized.substring(0, 2);

  const desc = shortcut?.description ?? 'Bilinmeyen ürün';
  const section = sectionInfo?.name ?? 'Bilinmeyen Bölüm';

  return `GTİP ${formatted}: ${desc} (${section}, Fasıl ${chapter})`;
}

/**
 * GTİP kodu için JSON formatında detaylı döküm.
 * Validasyon + resolver sonucu birleşimi.
 */
export function describeGtip(
  code: string,
  config?: Partial<GtipConfig>
): {
  validation: ReturnType<typeof validateGtip>;
  resolve: GtipResolveResult | null;
  explanation: string;
} {
  const validation = validateGtip(code, config);
  const resolve = validation.isValid ? resolveGtipCode(code, config) : null;
  const explanation = explainGtip(code, config);

  return { validation, resolve, explanation };
}
