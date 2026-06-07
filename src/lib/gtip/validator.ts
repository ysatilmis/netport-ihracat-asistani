// GTİP (HS Code) Validatörü — format ve geçerlilik kontrolü
import type { GtipValidationResult, GtipFormat, GtipConfig } from './types';
import { DEFAULT_GTIP_CONFIG } from './types';
import { KNOWN_GTIP_CODES } from './data';

/**
 * GTİP kodunu normalize eder:
 * - Noktaları temizler (5201.00 → 520100)
 * - Boşlukları temizler
 * - String'e çevirir
 */
export function normalizeGtip(input: unknown): string {
  if (typeof input !== 'string' && typeof input !== 'number') return '';
  const str = String(input).trim();
  return str.replace(/[.\s\-]/g, '');
}

/**
 * GTİP kodunun formatını belirler.
 */
export function detectGtipFormat(code: string): GtipFormat | null {
  const len = code.length;
  if (len === 6) return '6-digit';
  if (len === 8) return '8-digit';
  if (len === 12) return '12-digit';
  return null;
}

/**
 * GTİP kodunu formatlar: 520100 → 5201.00
 */
export function formatGtip(code: string): string {
  const normalized = normalizeGtip(code);
  if (normalized.length === 6) {
    return `${normalized.substring(0, 4)}.${normalized.substring(4, 6)}`;
  }
  if (normalized.length === 8) {
    return `${normalized.substring(0, 4)}.${normalized.substring(4, 6)}.${normalized.substring(6, 8)}`;
  }
  if (normalized.length === 12) {
    return `${normalized.substring(0, 4)}.${normalized.substring(4, 6)}.${normalized.substring(6, 8)}.${normalized.substring(8, 12)}`;
  }
  return code;
}

/**
 * GTİP kodunu valide eder.
 *
 * @example
 * validateGtip('520100') // { isValid: true, format: '6-digit', errors: [], normalizedCode: '520100' }
 * validateGtip('5201.00') // { isValid: true, format: '6-digit', ... }
 * validateGtip('ABC') // { isValid: false, format: null, errors: ['Sadece rakam içermelidir'], ... }
 */
export function validateGtip(
  input: unknown,
  config: Partial<GtipConfig> = {}
): GtipValidationResult {
  const cfg = { ...DEFAULT_GTIP_CONFIG, ...config };
  const errors: string[] = [];

  // Tip kontrolü
  if (typeof input !== 'string' && typeof input !== 'number') {
    return {
      code: String(input ?? ''),
      isValid: false,
      format: null,
      errors: ['GTİP kodu metin veya sayı olmalıdır'],
      normalizedCode: '',
    };
  }

  const code = String(input).trim();

  // Boş kontrol
  if (!code) {
    return {
      code: '',
      isValid: false,
      format: null,
      errors: ['GTİP kodu boş olamaz'],
      normalizedCode: '',
    };
  }

  const normalized = normalizeGtip(input);
  const original = code;

  // Uzunluk kontrolü
  if (normalized.length < 4 || normalized.length > 14) {
    errors.push(`GTİP kodu çok kısa veya çok uzun (${normalized.length} hane)`);
  }

  // Format kontrolü
  const format = detectGtipFormat(normalized);
  if (format === null) {
    // 4,5,7,9,10,11,13,14 haneli kodlar — geçersiz
    if (!cfg.validLengths.includes(normalized.length)) {
      errors.push(
        `Geçersiz GTİP uzunluğu: ${normalized.length} hane (geçerli: ${cfg.validLengths.join(', ')})`
      );
    }
  }

  // Sadece rakam kontrolü (noktalar normalize edildi)
  if (!/^\d+$/.test(normalized)) {
    errors.push('GTİP kodu sadece rakam içermelidir');
  }

  // Varlık kontrolü (opsiyonel — bilinen kodlardan)
  if (!cfg.skipExistenceCheck && !errors.length) {
    // 6 haneli kodlar için bilinen kod setinden kontrol et
    if (format === '6-digit' && !KNOWN_GTIP_CODES.has(normalized)) {
      errors.push(`GTİP kodu ${formatGtip(normalized)} bilinen kodlar arasında bulunamadı`);
    }
  }

  return {
    code: original,
    isValid: errors.length === 0,
    format,
    errors,
    normalizedCode: normalized,
  };
}

/**
 * GTİP kodunun bilinen bir kod olup olmadığını kontrol eder.
 * 6 haneli normalize edilmiş kodları shortcut tablosunda arar.
 */
export function isKnownGtip(code: string): boolean {
  const normalized = normalizeGtip(code);
  if (normalized.length !== 6) return false;
  return KNOWN_GTIP_CODES.has(normalized);
}
