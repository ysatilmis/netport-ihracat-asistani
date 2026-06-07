/**
 * Prompt Context — fakt sayfası sisteminin prompt cerrahisi için kullandığı context tipi.
 *
 * Task 8-9'da prompt builder'lar bu context'i kullanarak
 * report-prompts, positioning ve extract-countries promptlarını oluşturur.
 */

import type { FactSheet, FactSheetType } from './fact-sheet-types';

/**
 * Fakt sayfası prompt context'i.
 * LLM prompt'una embedding için gerekli tüm alanları içerir.
 */
export interface PromptContext {
  /** GTİP kodu (normalize edilmiş, 6 hane) */
  gtipCode: string;

  /** GTİP açıklaması (İngilizce) */
  gtipDescription: string;

  /** Ürün kategorisi (Türkçe, örn: "tekstil") */
  category: string;

  /** Fakt sayfası tipi */
  type: FactSheetType;

  /** Tazelik etiketi (Türkçe, örn: "son 3 ay") */
  recencyLabel: string;

  /** Tam grounding verisi (opsiyonel — varsa prompt'a eklenir) */
  factSheet?: FactSheet;

  /** Kullanıcının sorduğu orijinal soru / task */
  userQuery?: string;

  /** Hedef ülke (opsiyonel) */
  targetCountry?: string;

  /** Prompt'a eklenecek ek talimatlar (opsiyonel) */
  extraInstructions?: string;
}

/**
 * PromptContext factory — minimum alanlarla context oluşturur.
 */
export function createPromptContext(params: {
  gtipCode: string;
  gtipDescription: string;
  category: string;
  type: FactSheetType;
  recencyLabel: string;
  factSheet?: FactSheet;
  userQuery?: string;
  targetCountry?: string;
}): PromptContext {
  return {
    gtipCode: params.gtipCode,
    gtipDescription: params.gtipDescription,
    category: params.category,
    type: params.type,
    recencyLabel: params.recencyLabel,
    factSheet: params.factSheet,
    userQuery: params.userQuery,
    targetCountry: params.targetCountry,
  };
}

/**
 * PromptContext'ten GTİP grounding bilgisini çıkartır.
 * factSheet varsa renderFactSheetBlock ile metin üretir,
 * yoksa basit bir özet döndürür.
 */
export function formatPromptContext(ctx: PromptContext): string {
  const lines: string[] = [];
  const formattedCode = `${ctx.gtipCode.substring(0, 4)}.${ctx.gtipCode.substring(4, 6)}`;

  lines.push(`GTİP Kodu: ${formattedCode}`);
  lines.push(`Ürün: ${ctx.gtipDescription}`);
  lines.push(`Kategori: ${ctx.category}`);
  lines.push(`Rapor Türü: ${ctx.type}`);
  lines.push(`Veri Tazeliği: ${ctx.recencyLabel}`);

  if (ctx.targetCountry) {
    lines.push(`Hedef Ülke: ${ctx.targetCountry}`);
  }

  return lines.join('\n');
}
