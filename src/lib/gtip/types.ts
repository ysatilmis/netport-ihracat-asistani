// GTİP (HS Code) tip tanımları — Grounding Fact Sheet sistemi için

/** GTİP kodu formatı */
export type GtipFormat = '6-digit' | '8-digit' | '12-digit';

/** GTİP hiyerarşisi — fasıl (bölüm) */
export interface GtipChapter {
  code: string;
  description: string;
  section: number;
}

/** GTİP hiyerarşisi — pozisyon (4 hane) */
export interface GtipHeading {
  code: string;
  description: string;
  chapterCode: string;
}

/** GTİP hiyerarşisi — alt pozisyon (6 hane) */
export interface GtipSubheading {
  code: string;
  description: string;
  headingCode: string;
}

/** Validasyon sonucu */
export interface GtipValidationResult {
  code: string;
  isValid: boolean;
  format: GtipFormat | null;
  errors: string[];
  normalizedCode: string;
}

/** Resolver sonucu — bir GTİP kodu hakkında detaylı bilgi */
export interface GtipResolveResult {
  code: string;
  format: GtipFormat;
  description: string;
  /** Bölüm adı (örn. "XI: Tekstil ve Tekstil Eşyası") */
  section: string;
  /** Fasıl adı (örn. "52: Pamuk") */
  chapter: string;
  /** Pozisyon adı (4 hane açıklaması)  */
  heading: string;
}

/** Kısayol — yaygın GTİP kodları için takma ad */
export interface GtipShortcut {
  name: string;
  code: string;
  description: string;
  category: string;
}

/** GTİP resolver yapılandırması */
export interface GtipConfig {
  /** Geçerli GTİP uzunlukları */
  validLengths: number[];
  /** Allow dots in input (e.g. "5201.00") */
  allowDots: boolean;
  /** Skip existence check (validate format only) */
  skipExistenceCheck: boolean;
}

export const DEFAULT_GTIP_CONFIG: GtipConfig = {
  validLengths: [6, 8, 12],
  allowDots: true,
  skipExistenceCheck: false,
};
