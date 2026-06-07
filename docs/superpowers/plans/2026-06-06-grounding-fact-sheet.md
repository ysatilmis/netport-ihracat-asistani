# Grounding & Fakt-Sayfası Ön-Geçişi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fakt-kritik ihracat verisini (GTİP, gümrük rejimi, STA, fiyat, sertifika) grounded bir "fakt-sayfası" ön-geçişinden tek yetkili kaynak olarak üret; tüm bölüm promptlarına enjekte et; belirsizlik-yasağı kuralını iki katmanlı güven etiketiyle değiştir.

**Architecture:** `/api/report` route'unda, ülke seçildikten sonra deep-dive döngüsünden önce tek bir `buildFactSheet()` çağrısı çalışır. Deterministik tohum (gömülü HS nomenklatür + yaygın-TR-ihracı kısayol tablosu) + recency-kısıtlı Perplexity grounded çağrı + GTİP validasyonu + merge ile bir `FactSheet` üretilir, her bölüm promptuna "DOĞRULANMIŞ FAKT SAYFASI" bloğu olarak enjekte edilir.

**Tech Stack:** Next.js App Router · TypeScript · Vitest · `ai` SDK + `@ai-sdk/openai` (OpenRouter) · Perplexity sonar-pro.

**Spec:** `docs/superpowers/specs/2026-06-06-grounding-fact-sheet-design.md`

---

## File Structure

**Yeni dosyalar:**
- `src/lib/grounding/data/hs-nomenclature.json` — gömülü HS (Armonize Sistem) nomenklatür, Fasıl/başlık + açıklama.
- `scripts/build-hs-data.mjs` — datahub HS veri setini indirip JSON'a dönüştüren build script.
- `src/lib/grounding/common-tr-exports.ts` — elle doğrulanmış yaygın TR ihraç ürün → GTİP kısayol tablosu (deterministik çıpa).
- `src/lib/grounding/gtip-resolver.ts` — `resolveGtip`, `validateGtip`, `customsRegimeFromChapter`.
- `src/lib/grounding/fact-sheet.ts` — `Confidence`, `Fact<T>`, `FactSheet` tipleri + `CONFIDENCE_LABELS`.
- `src/lib/grounding/recency.ts` — `buildDateAnchor`, `downgradeByAge`.
- `src/lib/grounding/fact-sheet-builder.ts` — `buildFactSheet`.
- Testler: `src/__tests__/lib/grounding/*.test.ts`.

**Değişen dosyalar:**
- `src/lib/llm/index.ts` — Perplexity çağrısına recency parametresi.
- `src/lib/report-prompts.ts` — `PromptContext.factSheet`, `renderFactSheetBlock`, prompt cerrahisi.
- `src/lib/positioning-prompts.ts` — honesty politikası + tarih çıpası.
- `src/lib/extract-countries-claude.ts` — skor uydurma yumuşatma.
- `src/app/api/report/route.ts` — `buildFactSheet` çağrısı + enjeksiyon + persist + SSE event.

**Test komutu (her yerde):** `npx vitest run <dosya>` · tüm suite: `npm test`.

---

## Task 1: HS Nomenklatür Veri Seti + Build Script

**Files:**
- Create: `scripts/build-hs-data.mjs`
- Create: `src/lib/grounding/data/hs-nomenclature.json` (script üretir)
- Create: `src/lib/grounding/hs-data.ts` (typed loader)
- Test: `src/__tests__/lib/grounding/hs-data.test.ts`

- [ ] **Step 1: Build script yaz**

`scripts/build-hs-data.mjs` — datahub.io "harmonized-system" veri setini (CC-BY, HS 2/4/6 haneli + açıklama) indirir, sade JSON'a indirger. Kaynak erişilemezse script açık hata verir (manuel CSV fallback notu yazar).

```js
// scripts/build-hs-data.mjs
// HS nomenklatür (Armonize Sistem) veri setini indirir → src/lib/grounding/data/hs-nomenclature.json
// Kaynak: https://datahub.io/core/harmonized-system (CC-BY). Kolonlar: section,hscode,description,parent,level
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

const CSV_URL = 'https://raw.githubusercontent.com/datasets/harmonized-system/main/data/harmonized-system.csv'
const OUT = 'src/lib/grounding/data/hs-nomenclature.json'

function parseCsv(text) {
  const rows = []
  const lines = text.split(/\r?\n/).filter(Boolean)
  const header = lines[0].split(',')
  const idx = (n) => header.indexOf(n)
  for (let i = 1; i < lines.length; i++) {
    // basit CSV: description tırnak içinde virgül içerebilir
    const m = lines[i].match(/("([^"]|"")*"|[^,]*)(,|$)/g)
    if (!m) continue
    const cols = m.map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim())
    const code = cols[idx('hscode')]
    const description = cols[idx('description')]
    if (!code || !description) continue
    const digits = code.replace(/\D/g, '')
    if (![2, 4, 6].includes(digits.length)) continue
    rows.push({ code: digits, description, level: digits.length })
  }
  return rows
}

const res = await fetch(CSV_URL)
if (!res.ok) {
  console.error('HS veri seti indirilemedi:', res.status, '\nManuel: CSV indir, scripts/ altına koy, CSV_URL yerine local path ver.')
  process.exit(1)
}
const rows = parseCsv(await res.text())
if (rows.length < 1000) {
  console.error('Beklenenden az satır:', rows.length, '— parse hatalı olabilir.')
  process.exit(1)
}
await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(rows))
console.log('Yazıldı:', OUT, rows.length, 'kalem')
```

- [ ] **Step 2: Build script'i çalıştır**

Run: `node scripts/build-hs-data.mjs`
Expected: `Yazıldı: src/lib/grounding/data/hs-nomenclature.json <N> kalem` (N > 5000). Dosya oluşur.

> Erişim yoksa: datahub CSV'sini elle indir, `scripts/harmonized-system.csv` olarak kaydet, script'te `CSV_URL`'i `readFile('scripts/harmonized-system.csv','utf8')` ile değiştir.

- [ ] **Step 3: Typed loader yaz**

`src/lib/grounding/hs-data.ts`:

```ts
import raw from './data/hs-nomenclature.json'

export interface HsEntry {
  code: string        // 2/4/6 haneli HS kodu (sadece rakam)
  description: string
  level: 2 | 4 | 6
}

export const HS_ENTRIES = raw as HsEntry[]

const BY_CODE = new Map(HS_ENTRIES.map((e) => [e.code, e]))

/** Tam koddan (12 haneye kadar GTİP) HS6/HS4/HS2 girişini bulur. */
export function lookupHs(code: string): HsEntry | undefined {
  const d = code.replace(/\D/g, '')
  return BY_CODE.get(d.slice(0, 6)) ?? BY_CODE.get(d.slice(0, 4)) ?? BY_CODE.get(d.slice(0, 2))
}
```

`tsconfig.json`'da `resolveJsonModule` açık olmalı (Next varsayılanı açık).

- [ ] **Step 4: Test yaz**

`src/__tests__/lib/grounding/hs-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { HS_ENTRIES, lookupHs } from '@/lib/grounding/hs-data'

describe('hs-data', () => {
  it('veri seti yüklendi (5000+ kalem)', () => {
    expect(HS_ENTRIES.length).toBeGreaterThan(5000)
  })
  it('1509 (zeytinyağı) nomenklatürde var', () => {
    const e = lookupHs('1509')
    expect(e).toBeDefined()
    expect(e!.description.toLowerCase()).toContain('olive')
  })
  it('12 haneli GTİP\'i HS6\'ya indirger', () => {
    expect(lookupHs('150910000011')?.code).toBe('150910')
  })
})
```

- [ ] **Step 5: Testi çalıştır**

Run: `npx vitest run src/__tests__/lib/grounding/hs-data.test.ts`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-hs-data.mjs src/lib/grounding/data/hs-nomenclature.json src/lib/grounding/hs-data.ts src/__tests__/lib/grounding/hs-data.test.ts
git commit -m "feat(grounding): gömülü HS nomenklatür veri seti + loader"
```

---

## Task 2: Yaygın TR İhracı Kısayol Tablosu

**Files:**
- Create: `src/lib/grounding/common-tr-exports.ts`
- Test: `src/__tests__/lib/grounding/common-tr-exports.test.ts`

- [ ] **Step 1: Test yaz**

`src/__tests__/lib/grounding/common-tr-exports.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { matchCommonExport } from '@/lib/grounding/common-tr-exports'

describe('matchCommonExport', () => {
  it('zeytinyağı → 1509', () => {
    expect(matchCommonExport('organik zeytinyağı')?.code).toBe('1509')
  })
  it('prina yağı 1509 ile karışmaz → 1510', () => {
    expect(matchCommonExport('prina yağı')?.code).toBe('1510')
  })
  it('eşleşme yoksa undefined', () => {
    expect(matchCommonExport('kuantum bilgisayar')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Testi çalıştır (fail)**

Run: `npx vitest run src/__tests__/lib/grounding/common-tr-exports.test.ts`
Expected: FAIL — "matchCommonExport is not exported".

- [ ] **Step 3: Implementasyon yaz**

`src/lib/grounding/common-tr-exports.ts`. Daha spesifik aliaslar (prina) genel olandan (zeytinyağı) ÖNCE eşleşmeli — sıralama önemli.

```ts
export interface CommonExport {
  code: string          // HS başlığı (4 haneli) — deterministik çıpa
  description: string
  aliases: string[]     // küçük harf; spesifik olan önce
}

// Sıra önemli: daha dar terimler (prina) genel terimden (zeytinyağı) önce.
export const COMMON_TR_EXPORTS: CommonExport[] = [
  { code: '1510', description: 'Prina (zeytin posası) yağı', aliases: ['prina', 'pirina', 'pomace'] },
  { code: '1509', description: 'Zeytinyağı', aliases: ['zeytinyağı', 'zeytin yağı', 'olive oil', 'sızma zeytin'] },
  { code: '0802', description: 'Fındık (kabuklu/iç)', aliases: ['fındık', 'hazelnut'] },
  { code: '0804', description: 'Kuru incir/hurma', aliases: ['kuru incir', 'dried fig', 'incir'] },
  { code: '0806', description: 'Kuru üzüm', aliases: ['kuru üzüm', 'raisin', 'sultana'] },
  { code: '0813', description: 'Kuru kayısı/meyve', aliases: ['kuru kayısı', 'dried apricot', 'kayısı'] },
  { code: '0713', description: 'Bakliyat (kuru baklagil)', aliases: ['mercimek', 'nohut', 'bakliyat', 'lentil', 'chickpea'] },
  { code: '0409', description: 'Bal', aliases: ['bal', 'honey'] },
  { code: '2002', description: 'Domates salçası/konservesi', aliases: ['salça', 'domates salçası', 'tomato paste'] },
  { code: '2515', description: 'Mermer', aliases: ['mermer', 'marble', 'traverten', 'travertine'] },
  { code: '5701', description: 'Düğümlü halı', aliases: ['halı', 'carpet', 'rug', 'kilim'] },
  { code: '6109', description: 'Tişört/örme', aliases: ['tişört', 't-shirt', 'tshirt', 'örme tekstil'] },
  { code: '6908', description: 'Sırlı seramik karo', aliases: ['seramik', 'ceramic tile', 'fayans', 'karo'] },
  { code: '0805', description: 'Narenciye (turunçgil)', aliases: ['narenciye', 'turunçgil', 'limon', 'portakal', 'citrus', 'mandalina'] },
]

const NORM = (s: string) => s.toLowerCase().trim()

export function matchCommonExport(product: string): CommonExport | undefined {
  const p = NORM(product)
  return COMMON_TR_EXPORTS.find((e) => e.aliases.some((a) => p.includes(a)))
}
```

- [ ] **Step 4: Testi çalıştır (pass)**

Run: `npx vitest run src/__tests__/lib/grounding/common-tr-exports.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/grounding/common-tr-exports.ts src/__tests__/lib/grounding/common-tr-exports.test.ts
git commit -m "feat(grounding): yaygın TR ihracı GTİP kısayol tablosu"
```

---

## Task 3: GTİP Resolver / Validator

**Files:**
- Create: `src/lib/grounding/gtip-resolver.ts`
- Test: `src/__tests__/lib/grounding/gtip-resolver.test.ts`

- [ ] **Step 1: Test yaz**

`src/__tests__/lib/grounding/gtip-resolver.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveGtip, validateGtip, customsRegimeFromChapter } from '@/lib/grounding/gtip-resolver'

describe('customsRegimeFromChapter', () => {
  it('Fasıl 15 (yağlar) → tarım/CAP', () => {
    expect(customsRegimeFromChapter(15)).toBe('agricultural_cap')
  })
  it('Fasıl 69 (seramik) → sanayi', () => {
    expect(customsRegimeFromChapter(69)).toBe('industrial')
  })
})

describe('resolveGtip', () => {
  it('yaygın ürünü verified kısayoldan çözer', () => {
    const r = resolveGtip('organik zeytinyağı')
    expect(r.code).toBe('1509')
    expect(r.confidence).toBe('verified')
    expect(r.chapter).toBe(15)
  })
  it('bilinmeyen üründe undefined kod + unverified', () => {
    const r = resolveGtip('kuantum bilgisayar')
    expect(r.confidence).toBe('unverified')
  })
})

describe('validateGtip', () => {
  it('var olan kodu doğrular ve fasıl/açıklama döner', () => {
    const v = validateGtip('1509', 'zeytinyağı')
    expect(v.valid).toBe(true)
    expect(v.chapter).toBe(15)
  })
  it('nomenklatürde olmayan kodu invalid işaretler', () => {
    const v = validateGtip('9999', 'zeytinyağı')
    expect(v.valid).toBe(false)
    expect(v.mismatch).toBeTruthy()
  })
})
```

- [ ] **Step 2: Testi çalıştır (fail)**

Run: `npx vitest run src/__tests__/lib/grounding/gtip-resolver.test.ts`
Expected: FAIL — modül yok.

- [ ] **Step 3: Implementasyon yaz**

`src/lib/grounding/gtip-resolver.ts`. Fast-path = deterministik çıpa (verified); long-tail = nomenklatür araması (estimated/unverified). `validateGtip` kodun varlığını + fasıl rejimini teyit eder.

```ts
import { lookupHs } from './hs-data'
import { matchCommonExport } from './common-tr-exports'

export type CustomsRegimeType = 'industrial' | 'agricultural_cap' | 'other'

/** Fasıl 1–24 = tarım/gıda/içecek/tütün → AB CAP rejimi. Gerisi sanayi. */
export function customsRegimeFromChapter(chapter: number): CustomsRegimeType {
  if (chapter >= 1 && chapter <= 24) return 'agricultural_cap'
  if (chapter >= 25 && chapter <= 97) return 'industrial'
  return 'other'
}

const chapterOf = (code: string): number => parseInt(code.replace(/\D/g, '').slice(0, 2), 10) || 0

export interface ResolvedGtip {
  code?: string
  description: string
  chapter: number
  confidence: 'verified' | 'estimated' | 'unverified'
}

export function resolveGtip(product: string): ResolvedGtip {
  // 1) Deterministik çıpa
  const hit = matchCommonExport(product)
  if (hit) {
    return { code: hit.code, description: hit.description, chapter: chapterOf(hit.code), confidence: 'verified' }
  }
  // 2) Nomenklatür anahtar-kelime araması (kaba) → estimated
  const tokens = product.toLowerCase().split(/\s+/).filter((t) => t.length > 3)
  if (tokens.length > 0) {
    const found = require('./hs-data').HS_ENTRIES.find(
      (e: { description: string; level: number }) =>
        e.level >= 4 && tokens.some((t) => e.description.toLowerCase().includes(t)),
    )
    if (found) {
      return { code: found.code, description: found.description, chapter: chapterOf(found.code), confidence: 'estimated' }
    }
  }
  // 3) Çözülemedi
  return { code: undefined, description: 'GTİP belirlenemedi — gümrük müşaviriyle doğrulanmalı', chapter: 0, confidence: 'unverified' }
}

export interface GtipValidation {
  valid: boolean
  description: string
  chapter: number
  mismatch?: string
}

/** Model/önerilen kodu nomenklatüre karşı doğrular. */
export function validateGtip(code: string, product: string): GtipValidation {
  const entry = lookupHs(code)
  if (!entry) {
    return {
      valid: false,
      description: '',
      chapter: chapterOf(code),
      mismatch: `Kod ${code} HS nomenklatüründe bulunamadı — ürün "${product}" için doğrulanmalı.`,
    }
  }
  return { valid: true, description: entry.description, chapter: chapterOf(entry.code) }
}
```

> Not: `require('./hs-data')` yerine üstte `import { HS_ENTRIES } from './hs-data'` kullan; ESM tutarlılığı için Step 3'te import'a çevir:

```ts
import { lookupHs, HS_ENTRIES } from './hs-data'
// ... resolveGtip içinde:
const found = HS_ENTRIES.find(
  (e) => e.level >= 4 && tokens.some((t) => e.description.toLowerCase().includes(t)),
)
```

- [ ] **Step 4: Testi çalıştır (pass)**

Run: `npx vitest run src/__tests__/lib/grounding/gtip-resolver.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/grounding/gtip-resolver.ts src/__tests__/lib/grounding/gtip-resolver.test.ts
git commit -m "feat(grounding): GTİP resolver + validator + fasıl rejimi"
```

---

## Task 4: Fakt-Sayfası Tipleri + Recency Helper

**Files:**
- Create: `src/lib/grounding/fact-sheet.ts`
- Create: `src/lib/grounding/recency.ts`
- Test: `src/__tests__/lib/grounding/recency.test.ts`

- [ ] **Step 1: Tipleri yaz**

`src/lib/grounding/fact-sheet.ts`:

```ts
import type { CustomsRegimeType } from './gtip-resolver'

export type Confidence = 'verified' | 'estimated' | 'unverified'

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  verified: 'Doğrulandı',
  estimated: 'Tahmini',
  unverified: 'Doğrulanmalı',
}

export interface Fact<T> {
  value: T
  confidence: Confidence
  source?: string
  dataYear?: number
}

export interface GtipValue { code: string | null; description: string; chapter: number }
export interface CustomsRegimeValue {
  type: CustomsRegimeType
  euTreatment: string
  tariffMfn?: string
  trPreferential?: string
  originDoc?: string
}
export interface FtaValue { exists: boolean; agreementName?: string }
export interface PriceBandValue { low: number; high: number; currency: string; unit: string; basis: string }
export interface CertValue { name: string; regime: string; note?: string }

export interface FactSheet {
  product: string
  country: string
  generatedAt: string            // ISO tarih — recency çıpası
  category: Fact<string>
  gtip: Fact<GtipValue>
  customsRegime: Fact<CustomsRegimeValue>
  fta: Fact<FtaValue>
  priceBand: Fact<PriceBandValue | null>
  mandatoryCerts: Fact<CertValue[]>
  warnings: string[]
}
```

- [ ] **Step 2: Recency testini yaz**

`src/__tests__/lib/grounding/recency.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildDateAnchor, downgradeByAge } from '@/lib/grounding/recency'
import type { Fact } from '@/lib/grounding/fact-sheet'

describe('buildDateAnchor', () => {
  it('cari yılı içerir', () => {
    const anchor = buildDateAnchor(new Date('2026-06-06'))
    expect(anchor).toContain('2026')
    expect(anchor.toLowerCase()).toContain('güncel')
  })
})

describe('downgradeByAge', () => {
  const now = new Date('2026-06-06')
  it('2 yıl+ eski verified faktı estimated yapar', () => {
    const f: Fact<number> = { value: 1, confidence: 'verified', dataYear: 2023 }
    expect(downgradeByAge(f, now).confidence).toBe('estimated')
  })
  it('güncel verified faktı korur', () => {
    const f: Fact<number> = { value: 1, confidence: 'verified', dataYear: 2025 }
    expect(downgradeByAge(f, now).confidence).toBe('verified')
  })
  it('dataYear yoksa dokunmaz', () => {
    const f: Fact<number> = { value: 1, confidence: 'verified' }
    expect(downgradeByAge(f, now).confidence).toBe('verified')
  })
})
```

- [ ] **Step 3: Testi çalıştır (fail)**

Run: `npx vitest run src/__tests__/lib/grounding/recency.test.ts`
Expected: FAIL — recency modülü yok.

- [ ] **Step 4: Recency implementasyonu yaz**

`src/lib/grounding/recency.ts`:

```ts
import type { Fact } from './fact-sheet'

/** Tüm grounded promptlara enjekte edilen güncellik çıpası. */
export function buildDateAnchor(now: Date = new Date()): string {
  const iso = now.toISOString().slice(0, 10)
  const year = now.getFullYear()
  return [
    `> 📅 GÜNCELLİK: Bugün ${iso} (cari yıl ${year}).`,
    `En güncel veriyi öncele; ${year - 2}/${year - 1} verisini ancak daha yenisi yoksa kullan ve veri yılını mutlaka etiketle.`,
    `Eski veriyi güncelmiş gibi sunma.`,
  ].join(' ')
}

/** 2+ yıl eski 'verified' faktı 'estimated'e düşürür. */
export function downgradeByAge<T>(fact: Fact<T>, now: Date = new Date()): Fact<T> {
  if (fact.confidence !== 'verified' || !fact.dataYear) return fact
  if (now.getFullYear() - fact.dataYear >= 2) return { ...fact, confidence: 'estimated' }
  return fact
}
```

- [ ] **Step 5: Testi çalıştır (pass)**

Run: `npx vitest run src/__tests__/lib/grounding/recency.test.ts`
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/grounding/fact-sheet.ts src/lib/grounding/recency.ts src/__tests__/lib/grounding/recency.test.ts
git commit -m "feat(grounding): fakt-sayfası tipleri + recency (tarih çıpası, veri-yılı düşürme)"
```

---

## Task 5: Perplexity Recency Parametresi (llm)

**Files:**
- Modify: `src/lib/llm/index.ts`
- Create: `src/lib/grounding/grounded-call.ts` (test edilebilir saf builder)
- Test: `src/__tests__/lib/grounding/grounded-call.test.ts`

- [ ] **Step 1: Test yaz**

`src/__tests__/lib/grounding/grounded-call.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildPerplexityProviderOptions } from '@/lib/grounding/grounded-call'

describe('buildPerplexityProviderOptions', () => {
  it('son 1 yıl recency filtresi üretir', () => {
    const opts = buildPerplexityProviderOptions('year')
    expect(opts.perplexity.search_recency_filter).toBe('year')
  })
  it('month filtresi destekler', () => {
    expect(buildPerplexityProviderOptions('month').perplexity.search_recency_filter).toBe('month')
  })
})
```

- [ ] **Step 2: Testi çalıştır (fail)**

Run: `npx vitest run src/__tests__/lib/grounding/grounded-call.test.ts`
Expected: FAIL — modül yok.

- [ ] **Step 3: Provider-option builder yaz**

`src/lib/grounding/grounded-call.ts`:

```ts
export type RecencyWindow = 'month' | 'year'

/**
 * OpenRouter üzerinden Perplexity sonar-pro'ya geçilecek provider options.
 * search_recency_filter desteklenmezse sağlayıcı yok sayar (sessiz fallback);
 * tarih çıpası (recency.ts) ikinci savunma hattıdır.
 */
export function buildPerplexityProviderOptions(window: RecencyWindow = 'year') {
  return { perplexity: { search_recency_filter: window } } as const
}
```

- [ ] **Step 4: `generateText` çağrısına bağla**

`src/lib/llm/index.ts` — Perplexity dalındaki `generateText` çağrısına `providerOptions` ekle (mevcut imza korunur):

`src/lib/llm/index.ts:37-42` bloğunu şununla değiştir:

```ts
    const resultPromise = generateText({
      model: openrouter(modelId),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      providerOptions: buildPerplexityProviderOptions('year'),
      ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
    })
```

Dosyanın başına import ekle:

```ts
import { buildPerplexityProviderOptions } from '@/lib/grounding/grounded-call'
```

- [ ] **Step 5: Testi + tip kontrolü çalıştır**

Run: `npx vitest run src/__tests__/lib/grounding/grounded-call.test.ts`
Expected: 2 passed.
Run: `npx tsc --noEmit`
Expected: hata yok (providerOptions AI SDK tipinde kabul edilir; edilmezse `providerOptions: buildPerplexityProviderOptions('year') as never` ile daralt ve yorum bırak).

- [ ] **Step 6: Commit**

```bash
git add src/lib/grounding/grounded-call.ts src/lib/llm/index.ts src/__tests__/lib/grounding/grounded-call.test.ts
git commit -m "feat(grounding): Perplexity recency provider-option (son 1 yıl önceliği)"
```

---

## Task 6: Fakt-Sayfası Builder

**Files:**
- Create: `src/lib/grounding/fact-sheet-builder.ts`
- Test: `src/__tests__/lib/grounding/fact-sheet-builder.test.ts`

Builder grounded LLM çağrısını **enjekte edilen bir fonksiyon** üzerinden yapar → test mock'lanabilir, ağ gerektirmez.

- [ ] **Step 1: Test yaz**

`src/__tests__/lib/grounding/fact-sheet-builder.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildFactSheet } from '@/lib/grounding/fact-sheet-builder'

// Grounded çağrıyı taklit eden fake: model 1510 öneriyor (yanlış), fiyat veriyor.
const fakeGroundedJson = JSON.stringify({
  category: 'tarımsal gıda',
  gtip_code: '1510',
  price_band: { low: 6.5, high: 7.5, currency: 'USD', unit: 'L', basis: 'ambalajlı FOB' },
  price_data_year: 2026,
  fta: { exists: false },
  certs: [{ name: 'AB Organik (Reg 2018/848)', regime: 'organik' }],
})

describe('buildFactSheet', () => {
  it('deterministik kısayol model GTİP\'ini ezer (1510 → 1509)', async () => {
    const fs = await buildFactSheet('organik zeytinyağı', 'Almanya', {
      groundedCall: async () => ({ text: fakeGroundedJson, tokensUsed: 100 }),
    })
    expect(fs.gtip.value.code).toBe('1509')
    expect(fs.gtip.confidence).toBe('verified')
    expect(fs.customsRegime.value.type).toBe('agricultural_cap')
    expect(fs.customsRegime.value.euTreatment.toLowerCase()).toContain('cap')
  })

  it('fiyat bandını grounded çağrıdan alır', async () => {
    const fs = await buildFactSheet('organik zeytinyağı', 'Almanya', {
      groundedCall: async () => ({ text: fakeGroundedJson, tokensUsed: 100 }),
    })
    expect(fs.priceBand.value?.low).toBe(6.5)
  })

  it('grounded çağrı hata verirse graceful: tohum kalır, alanlar unverified', async () => {
    const fs = await buildFactSheet('organik zeytinyağı', 'Almanya', {
      groundedCall: async () => { throw new Error('network') },
    })
    expect(fs.gtip.value.code).toBe('1509')        // deterministik tohum durur
    expect(fs.priceBand.confidence).toBe('unverified')
    expect(fs.warnings.some((w) => w.includes('fakt-sayfası'))).toBe(true)
  })
})
```

- [ ] **Step 2: Testi çalıştır (fail)**

Run: `npx vitest run src/__tests__/lib/grounding/fact-sheet-builder.test.ts`
Expected: FAIL — modül yok.

- [ ] **Step 3: Builder implementasyonu yaz**

`src/lib/grounding/fact-sheet-builder.ts`:

```ts
import { generateText } from 'ai'
import { openrouter } from '@/lib/llm'
import { resolveGtip, validateGtip, customsRegimeFromChapter, type CustomsRegimeType } from './gtip-resolver'
import { buildDateAnchor, downgradeByAge } from './recency'
import { buildPerplexityProviderOptions } from './grounded-call'
import type { FactSheet, Fact, CustomsRegimeValue, PriceBandValue, CertValue } from './fact-sheet'

interface GroundedResult { text: string; tokensUsed: number }
interface BuildDeps {
  groundedCall?: (prompt: string) => Promise<GroundedResult>
}

function euTreatmentFor(type: CustomsRegimeType): string {
  if (type === 'agricultural_cap')
    return 'AB-Türkiye Gümrük Birliği sanayi ürünleriyle sınırlı; bu ürün Ortak Tarım Politikası (CAP) kapsamında — serbest DEĞİL, ek vergi/tarife kotası uygulanabilir. EUR.1 ile tercihli tarife mümkün olabilir, doğrulanmalı.'
  if (type === 'industrial')
    return 'Türkiye-AB Gümrük Birliği kapsamında sanayi ürünü — ATR.1 dolaşım belgesiyle %0 tarife uygulanır.'
  return 'Gümrük rejimi belirsiz — gümrük müşaviriyle doğrulanmalı.'
}

async function defaultGroundedCall(prompt: string): Promise<GroundedResult> {
  const r = await generateText({
    model: openrouter('perplexity/sonar-pro'),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    maxOutputTokens: 900,
    providerOptions: buildPerplexityProviderOptions('year'),
  })
  return { text: r.text, tokensUsed: r.usage?.totalTokens ?? 0 }
}

function buildGroundedPrompt(product: string, country: string, seedCode: string | null): string {
  return `${buildDateAnchor()}

Sen Türkiye ihracat verisi doğrulayan bir araştırma analistisin. UYDURMA YASAK — bilmediğin alanı boş bırak.

Ürün: "${product}"  ·  Hedef ülke: ${country}
${seedCode ? `Doğrulanmış GTİP başlığı (YETKİLİ, değiştirme): ${seedCode}` : ''}

Aşağıdaki alanları araştır ve SADECE şu JSON'u döndür (markdown yok):
{
  "category": "<ürün kategorisi, kısa>",
  "gtip_code": "<en olası GTİP/HS kodu; emin değilsen boş string>",
  "price_band": {"low": <sayı>, "high": <sayı>, "currency": "USD", "unit": "<birim>", "basis": "<FOB/CIF, ambalaj>"},
  "price_data_year": <yıl>,
  "fta": {"exists": <true|false>, "agreement_name": "<varsa ad, yoksa boş>"},
  "certs": [{"name": "<sertifika>", "regime": "<organik/gıda/genel>", "note": "<opsiyonel>"}]
}
Fiyatı ${country} pazarındaki güncel ihraç fiyatına göre ver. STA/FTA gerçekten yoksa exists=false — UYDURMA.`
}

function parseJson(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

export async function buildFactSheet(
  product: string,
  country: string,
  deps: BuildDeps = {},
): Promise<FactSheet> {
  const call = deps.groundedCall ?? defaultGroundedCall
  const warnings: string[] = []
  const now = new Date()

  // 1) Deterministik tohum
  const seed = resolveGtip(product)
  const regimeType = customsRegimeFromChapter(seed.chapter)

  let gtip: Fact<{ code: string | null; description: string; chapter: number }> = {
    value: { code: seed.code ?? null, description: seed.description, chapter: seed.chapter },
    confidence: seed.confidence,
    source: seed.confidence === 'verified' ? 'TR ihracat kısayol tablosu + HS nomenklatür' : 'HS nomenklatür (tahmini)',
  }
  const customsRegime: Fact<CustomsRegimeValue> = {
    value: { type: regimeType, euTreatment: euTreatmentFor(regimeType), originDoc: regimeType === 'industrial' ? 'ATR.1' : 'EUR.1 (doğrulanmalı)' },
    confidence: seed.confidence === 'verified' ? 'verified' : 'unverified',
    source: 'HS fasıl → AB rejimi (deterministik)',
  }

  // 2) Grounded çağrı
  let category: Fact<string> = { value: '', confidence: 'unverified' }
  let fta: Fact<{ exists: boolean; agreementName?: string }> = { value: { exists: false }, confidence: 'unverified' }
  let priceBand: Fact<PriceBandValue | null> = { value: null, confidence: 'unverified' }
  let mandatoryCerts: Fact<CertValue[]> = { value: [], confidence: 'unverified' }

  try {
    const res = await call(buildGroundedPrompt(product, country, seed.code ?? null))
    const j = parseJson(res.text)
    if (!j) {
      warnings.push('fakt-sayfası: grounded yanıt JSON olarak ayıklanamadı; alanlar doğrulanmadı.')
    } else {
      if (typeof j.category === 'string') category = { value: j.category, confidence: 'estimated', source: 'Perplexity' }

      // Model GTİP'i sadece tohum yoksa kullanılır; tohum daima ezer.
      if (!seed.code && typeof j.gtip_code === 'string' && j.gtip_code.trim()) {
        const v = validateGtip(j.gtip_code, product)
        gtip = {
          value: { code: v.valid ? j.gtip_code : null, description: v.description || gtip.value.description, chapter: v.chapter },
          confidence: v.valid ? 'estimated' : 'unverified',
          source: 'Perplexity + HS validasyon',
        }
        if (v.mismatch) warnings.push(v.mismatch)
      }

      const pb = j.price_band as Partial<PriceBandValue> | undefined
      if (pb && typeof pb.low === 'number' && typeof pb.high === 'number') {
        priceBand = {
          value: { low: pb.low, high: pb.high, currency: pb.currency ?? 'USD', unit: pb.unit ?? '', basis: pb.basis ?? '' },
          confidence: 'estimated',
          source: 'Perplexity',
          dataYear: typeof j.price_data_year === 'number' ? j.price_data_year : undefined,
        }
      }

      const f = j.fta as { exists?: boolean; agreement_name?: string } | undefined
      if (f && typeof f.exists === 'boolean') {
        fta = { value: { exists: f.exists, agreementName: f.agreement_name || undefined }, confidence: 'estimated', source: 'Perplexity' }
      }

      if (Array.isArray(j.certs)) {
        mandatoryCerts = {
          value: (j.certs as CertValue[]).filter((c) => c && c.name).map((c) => ({ name: String(c.name), regime: String(c.regime ?? ''), note: c.note })),
          confidence: 'estimated',
          source: 'Perplexity',
        }
      }
    }
  } catch {
    warnings.push('fakt-sayfası: grounded çağrı başarısız; sadece deterministik tohum kullanıldı, diğer alanlar doğrulanmalı.')
  }

  // 4) Recency: veri-yılı confidence düşürme
  priceBand = downgradeByAge(priceBand, now)

  return {
    product,
    country,
    generatedAt: now.toISOString(),
    category,
    gtip,
    customsRegime,
    fta,
    priceBand,
    mandatoryCerts,
    warnings,
  }
}
```

- [ ] **Step 4: Testi çalıştır (pass)**

Run: `npx vitest run src/__tests__/lib/grounding/fact-sheet-builder.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/grounding/fact-sheet-builder.ts src/__tests__/lib/grounding/fact-sheet-builder.test.ts
git commit -m "feat(grounding): fakt-sayfası builder (tohum + grounded + validasyon + merge)"
```

---

## Task 7: Fakt-Sayfası Enjeksiyonu + renderFactSheetBlock

**Files:**
- Modify: `src/lib/report-prompts.ts` (PromptContext + helper, prompt gövdelerine henüz dokunma)
- Test: `src/__tests__/lib/grounding/render-fact-sheet.test.ts`

- [ ] **Step 1: Test yaz**

`src/__tests__/lib/grounding/render-fact-sheet.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { renderFactSheetBlock } from '@/lib/report-prompts'
import type { FactSheet } from '@/lib/grounding/fact-sheet'

const fs: FactSheet = {
  product: 'organik zeytinyağı', country: 'Almanya', generatedAt: '2026-06-06T00:00:00Z',
  category: { value: 'tarımsal gıda', confidence: 'estimated' },
  gtip: { value: { code: '1509', description: 'Zeytinyağı', chapter: 15 }, confidence: 'verified', source: 'HS' },
  customsRegime: { value: { type: 'agricultural_cap', euTreatment: 'CAP kapsamı, serbest değil' }, confidence: 'verified' },
  fta: { value: { exists: false }, confidence: 'estimated' },
  priceBand: { value: { low: 6.5, high: 7.5, currency: 'USD', unit: 'L', basis: 'FOB' }, confidence: 'estimated', dataYear: 2026 },
  mandatoryCerts: { value: [{ name: 'AB Organik', regime: 'organik' }], confidence: 'estimated' },
  warnings: [],
}

describe('renderFactSheetBlock', () => {
  it('GTİP\'i Doğrulandı etiketiyle basar', () => {
    const out = renderFactSheetBlock(fs)
    expect(out).toContain('1509')
    expect(out).toContain('Doğrulandı')
  })
  it('STA yokluğunu ve fiyatı içerir', () => {
    const out = renderFactSheetBlock(fs)
    expect(out).toContain('DOĞRULANMIŞ FAKT SAYFASI')
    expect(out).toContain('6.5')
  })
})
```

- [ ] **Step 2: Testi çalıştır (fail)**

Run: `npx vitest run src/__tests__/lib/grounding/render-fact-sheet.test.ts`
Expected: FAIL — `renderFactSheetBlock` yok.

- [ ] **Step 3: PromptContext + helper ekle**

`src/lib/report-prompts.ts` — `import` satırlarının altına ve `PromptContext`'e ekle:

```ts
import type { FactSheet, Fact, Confidence } from './grounding/fact-sheet'
import { CONFIDENCE_LABELS } from './grounding/fact-sheet'
```

`PromptContext` arayüzüne alan ekle:

```ts
export interface PromptContext {
  selectedCountry?: string
  previousSections: Record<string, PreviousSection>
  factSheet?: FactSheet            // YENİ — grounded fakt-sayfası
}
```

Dosyanın sonuna (export'lardan önce) helper ekle:

```ts
function tag(c: Confidence, source?: string, year?: number): string {
  const label = CONFIDENCE_LABELS[c]
  const extra = [source, year ? String(year) : ''].filter(Boolean).join(', ')
  return extra ? `[${label}: ${extra}]` : `[${label}]`
}

function factLine<T>(name: string, fact: Fact<T>, fmt: (v: T) => string): string {
  return `- **${name}:** ${fmt(fact.value)} ${tag(fact.confidence, fact.source, fact.dataYear)}`
}

export function renderFactSheetBlock(fs: FactSheet): string {
  const lines = [
    '## DOĞRULANMIŞ FAKT SAYFASI (yetkili kaynak — AYNEN kullan; çelişme, uydurma; güven etiketini koru)',
    factLine('Kategori', fs.category, (v) => v || '—'),
    factLine('GTİP', fs.gtip, (v) => v.code ? `${v.code} (${v.description})` : v.description),
    factLine('Gümrük rejimi', fs.customsRegime, (v) => `${v.type === 'agricultural_cap' ? 'Tarım/CAP' : v.type === 'industrial' ? 'Sanayi' : 'Belirsiz'} — ${v.euTreatment}`),
    factLine('Türkiye–' + fs.country + ' STA', fs.fta, (v) => v.exists ? (v.agreementName || 'var') : 'YOK (anlaşma uydurma)'),
    factLine('İhraç fiyat bandı', fs.priceBand, (v) => v ? `${v.low}–${v.high} ${v.currency}/${v.unit} (${v.basis})` : 'doğrulanamadı'),
    factLine('Zorunlu sertifikalar', fs.mandatoryCerts, (v) => v.length ? v.map((c) => c.name).join(', ') : 'belirlenmedi'),
  ]
  if (fs.warnings.length) lines.push('> ⚠ Notlar: ' + fs.warnings.join(' | '))
  lines.push('---', '')
  return lines.join('\n')
}
```

- [ ] **Step 4: Testi çalıştır (pass)**

Run: `npx vitest run src/__tests__/lib/grounding/render-fact-sheet.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/report-prompts.ts src/__tests__/lib/grounding/render-fact-sheet.test.ts
git commit -m "feat(grounding): renderFactSheetBlock + PromptContext.factSheet"
```

---

## Task 8: Prompt Cerrahisi — report-prompts

**Files:**
- Modify: `src/lib/report-prompts.ts`
- Test: `src/__tests__/lib/grounding/prompt-surgery.test.ts`

Belirsizlik-yasağı kuralını kaldır, honesty politikası koy, fakt-sayfasını enjekte et, "el işçiliği"yi temizle, target_countries customs yumuşat. `/prompt-duzelt` skill'i bu adımda promptların yeniden yazımına yardımcı olabilir.

- [ ] **Step 1: Regresyon testi yaz**

`src/__tests__/lib/grounding/prompt-surgery.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { REPORT_SECTIONS } from '@/lib/report-prompts'
import type { FactSheet } from '@/lib/grounding/fact-sheet'

const allPrompts = () =>
  REPORT_SECTIONS.map((s) => s.buildPrompt('zeytinyağı', { previousSections: {}, selectedCountry: 'Almanya' })).join('\n')

// renderFactSheetBlock TÜM alanlara eriştiği için TAM fixture şart (minimal cast crash eder).
const sampleFactSheet: FactSheet = {
  product: 'organik zeytinyağı', country: 'Almanya', generatedAt: '2026-06-06T00:00:00Z',
  category: { value: 'tarımsal gıda', confidence: 'estimated' },
  gtip: { value: { code: '1509', description: 'Zeytinyağı', chapter: 15 }, confidence: 'verified', source: 'HS' },
  customsRegime: { value: { type: 'agricultural_cap', euTreatment: 'CAP kapsamı, serbest değil' }, confidence: 'verified' },
  fta: { value: { exists: false }, confidence: 'estimated' },
  priceBand: { value: { low: 6.5, high: 7.5, currency: 'USD', unit: 'L', basis: 'FOB' }, confidence: 'estimated', dataYear: 2026 },
  mandatoryCerts: { value: [{ name: 'AB Organik', regime: 'organik' }], confidence: 'estimated' },
  warnings: [],
}

describe('prompt cerrahisi — report', () => {
  it('belirsizlik-yasağı ifadesi tüm promptlardan kalktı', () => {
    const text = allPrompts()
    expect(text).not.toContain("'veri yok' yazma")
    expect(text).not.toContain('raporu zayıf gösterir')
  })
  it('"el işçiliği" örneği usp_positioning\'den kalktı', () => {
    const text = allPrompts()
    expect(text).not.toContain('el işçiliği')
  })
  it('honesty politikası SOMUTLASTIRMA içinde var', () => {
    expect(allPrompts()).toContain('güven etiketini koru')
  })
  it('fakt-sayfası verilince bölüm promptuna enjekte edilir', () => {
    const legal = REPORT_SECTIONS.find((s) => s.key === 'legal_customs')!
    const out = legal.buildPrompt('zeytinyağı', { previousSections: {}, selectedCountry: 'Almanya', factSheet: sampleFactSheet })
    expect(out).toContain('DOĞRULANMIŞ FAKT SAYFASI')
    expect(out).toContain('1509')
  })
})
```

- [ ] **Step 2: Testi çalıştır (fail)**

Run: `npx vitest run src/__tests__/lib/grounding/prompt-surgery.test.ts`
Expected: FAIL — eski ifadeler hâlâ var.

- [ ] **Step 3: SOMUTLASTIRMA + honesty politikasını değiştir**

`src/lib/report-prompts.ts` — `SOMUTLASTIRMA` sabitini şununla değiştir:

```ts
const SOMUTLASTIRMA = `
> 🎯 SOMUTLAŞTIRMA & DÜRÜSTLÜK KURALI: Her veri için değer + kaynak + yıl ver. Belirsiz zarflar ("yaklaşık", "genellikle", "çoğunlukla") yasak.
> Fakt sayfası verildiyse: oradaki güven etiketini ([Doğrulandı]/[Tahmini]/[Doğrulanmalı]) KORU. "Doğrulanmalı" etiketli veriyi kesinmiş gibi sunma — etiketiyle aktar.
> Fakt sayfasında OLMAYAN sayısal iddia ÜRETME; gerekirse "doğrulanmalı" diye işaretle veya o satırı tamamen atla. Uydurmak boş bırakmaktan KÖTÜDÜR.
`.trim()
```

- [ ] **Step 4: Eski "proxy tahmin" kalite kurallarını temizle**

`src/lib/report-prompts.ts` içinde **iki yerde** geçen şu satırı (target_countries ve market_size_growth Kalite Kuralları) sil:

```
- Her sayısal veriye kaynak ekle. Kesin veri yoksa proxy tahmin ver, "veri yok" yazma. Tahminlerini "⚠" ile işaretleme, raporu zayıf gösterir.
```

Yerine:

```
- Her sayısal veriye kaynak + yıl ekle. Kesin veri yoksa "doğrulanmalı" diye işaretle; uydurma rakam KOYMA.
```

- [ ] **Step 5: Fakt-sayfası enjeksiyonunu buildContextBlock'a bağla**

`buildContextBlock` fonksiyonunu, çağıran her bölümün fakt-sayfasını da basması için güncelle. En temiz yol: her `buildPrompt` içinde `${buildContextBlock(ctx, [...])}` zaten var; bunların ÜSTÜNE fakt-sayfası gelsin. `buildContextBlock`'u şöyle sar:

```ts
function buildGroundingBlock(ctx: PromptContext): string {
  return ctx.factSheet ? renderFactSheetBlock(ctx.factSheet) + '\n' : ''
}
```

Sonra **her bölümün** `buildPrompt` gövdesinde, `${buildContextBlock(ctx, [...])}` satırının hemen ÖNÜNE `${buildGroundingBlock(ctx)}` ekle. (target_countries hariç — o ülke seçiminden önce, fakt-sayfası yok.) Asgari kritik bölümler: `legal_customs`, `price_strategy`, `market_size_growth`, `executive_summary`. Tutarlılık için 10 deep-dive bölümün hepsine ekle.

- [ ] **Step 6: legal_customs ve price_strategy'yi fakt-sayfasına yasla**

`legal_customs` görev metnindeki GTİP maddesini değiştir:

```
1. **GTİP kodu** — Fakt sayfasındaki GTİP'i AYNEN kullan (etiketiyle). Fakt sayfası yoksa veya "Doğrulanmalı" ise: tahmini ver + "gümrük müşaviriyle doğrulanmalı" notu. ASLA kendi başına kesin kod uydurma.
```

`legal_customs` içindeki mevcut "VERGİ UYARISI (KRİTİK)" bloğunu koru ama sonuna ekle:

```
Fakt sayfasındaki gümrük rejimi (Tarım/CAP vs Sanayi) YETKİLİDİR — onunla çeliş­me.
```

`price_strategy` görev metnine ekle (1. madde başına):

```
0. **Fiyat çıpası** — Fakt sayfasındaki ihraç fiyat bandını temel al; raf fiyatlarını bu çıpa üzerinden türet. Fakt sayfası fiyatı "Doğrulanmalı" ise tahmini olduğunu belirt.
```

- [ ] **Step 7: "el işçiliği" + target_countries customs**

`usp_positioning` 2. maddesini değiştir:

```
2. **Türkiye üretiminin somut güçleri** — sadece bu ürün için GEÇERLİ olanları seç (maliyet / hammadde kalitesi / esnek MOQ / hızlı teslim / coğrafi köken). Ürüne uymayan genel tabirler (ör. zanaat olmayan üründe "el işçiliği") KULLANMA.
```

`target_countries` ZORUNLU SON BLOK açıklamasındaki `customs_advantage` tarifini yumuşat:

```
"customs_advantage":"<AB GB / STA / GTS / yok / doğrulanmalı — emin değilsen 'doğrulanmalı' yaz, anlaşma UYDURMA>"
```

- [ ] **Step 8: Testi çalıştır (pass)**

Run: `npx vitest run src/__tests__/lib/grounding/prompt-surgery.test.ts`
Expected: 4 passed.
Run: `npm test`
Expected: tüm suite yeşil (mevcut prompts.test.ts dahil).

- [ ] **Step 9: Commit**

```bash
git add src/lib/report-prompts.ts src/__tests__/lib/grounding/prompt-surgery.test.ts
git commit -m "feat(grounding): report prompt cerrahisi — honesty politikası + fakt-sayfası yaslama + el-işçiliği temizliği"
```

---

## Task 9: Prompt Cerrahisi — positioning + extract-countries

**Files:**
- Modify: `src/lib/positioning-prompts.ts`
- Modify: `src/lib/extract-countries-claude.ts`
- Test: `src/__tests__/lib/grounding/positioning-surgery.test.ts`

- [ ] **Step 1: Test yaz**

`src/__tests__/lib/grounding/positioning-surgery.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { POSITIONING_SECTIONS } from '@/lib/positioning-prompts'

const ctx = {
  product: 'zeytinyağı', country: 'Almanya', targetLanguage: 'de',
  languageLabel: 'Almanca (Deutsch)', marketSummary: '', previousSections: {},
}

describe('positioning prompt cerrahisi', () => {
  it('persona promptu kanıtsız bütçe yerine "doğrulanmalı" diyor', () => {
    const personas = POSITIONING_SECTIONS.find((s) => s.key === 'personas')!
    const out = personas.buildPrompt(ctx)
    expect(out.toLowerCase()).toContain('doğrulanmalı')
  })
  it('tarih çıpası en az bir bölümde var', () => {
    const text = POSITIONING_SECTIONS.map((s) => s.buildPrompt(ctx)).join('\n')
    expect(text).toContain('GÜNCELLİK')
  })
})
```

- [ ] **Step 2: Testi çalıştır (fail)**

Run: `npx vitest run src/__tests__/lib/grounding/positioning-surgery.test.ts`
Expected: FAIL.

- [ ] **Step 3: positioning-prompts'a tarih çıpası + honesty ekle**

`src/lib/positioning-prompts.ts` başına import:

```ts
import { buildDateAnchor } from './grounding/recency'
```

`personas` bölümünün 2. zorunlu alanını değiştir:

```
2. **Yıllık Alım Bütçesi** — USD aralığı. Kesin veri yoksa "tahmini, doğrulanmalı" diye işaretle; kanıtsız kesin rakam verme.
```

`usp` bölümünün başındaki `## Bağlam` satırından önce çıpayı ekle (template literal içine):

```
${buildDateAnchor()}
```

(Aynı satırı `personas`, `product_description`, `cold_email` template'lerinin başına da ekleyebilirsin; asgari `usp` yeterli — test tek bölümde çıpa arıyor, ama tutarlılık için hepsine önerilir.)

- [ ] **Step 4: extract-countries skor uydurmayı yumuşat**

`src/lib/extract-countries-claude.ts` SYSTEM_PROMPT içindeki skor kuralını değiştir:

```
- Skor metinde açıkça belirtilmişse onu kullan; belirtilmemişse metindeki sinyallere dayalı muhafazakâr bir tahmin koy (6-8) ve abartma. Veri yoksa düşük skordan kaçınma.
```

- [ ] **Step 5: Testi çalıştır (pass)**

Run: `npx vitest run src/__tests__/lib/grounding/positioning-surgery.test.ts`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/positioning-prompts.ts src/lib/extract-countries-claude.ts src/__tests__/lib/grounding/positioning-surgery.test.ts
git commit -m "feat(grounding): positioning + extract-countries honesty/recency cerrahisi"
```

---

## Task 10: Route Entegrasyonu — buildFactSheet'i /api/report'a bağla

**Files:**
- Modify: `src/app/api/report/route.ts`
- Test: `src/__tests__/lib/grounding/route-wiring.test.ts` (saf helper testi)

Route streaming olduğu için saf bir helper'ı (`buildSectionContext`) ayıklayıp onu test ederiz; route'un kendisi bu helper'ı kullanır.

- [ ] **Step 1: Test yaz**

`src/__tests__/lib/grounding/route-wiring.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { attachFactSheet } from '@/app/api/report/fact-sheet-context'
import type { FactSheet } from '@/lib/grounding/fact-sheet'

describe('attachFactSheet', () => {
  it('ctx\'e fakt-sayfasını ekler', () => {
    const fs = { product: 'x', country: 'Almanya' } as unknown as FactSheet
    const ctx = attachFactSheet({ selectedCountry: 'Almanya', previousSections: {} }, fs)
    expect(ctx.factSheet).toBe(fs)
    expect(ctx.selectedCountry).toBe('Almanya')
  })
})
```

- [ ] **Step 2: Helper yaz**

`src/app/api/report/fact-sheet-context.ts`:

```ts
import type { PromptContext } from '@/lib/report-prompts'
import type { FactSheet } from '@/lib/grounding/fact-sheet'

export function attachFactSheet(ctx: PromptContext, factSheet: FactSheet | null): PromptContext {
  return factSheet ? { ...ctx, factSheet } : ctx
}
```

- [ ] **Step 3: Testi çalıştır (pass)**

Run: `npx vitest run src/__tests__/lib/grounding/route-wiring.test.ts`
Expected: 1 passed.

- [ ] **Step 4: Route'a buildFactSheet'i bağla**

`src/app/api/report/route.ts`:

İmport ekle:

```ts
import { buildFactSheet } from '@/lib/grounding/fact-sheet-builder'
import { attachFactSheet } from './fact-sheet-context'
import type { FactSheet } from '@/lib/grounding/fact-sheet'
```

`ReadableStream` `start(controller)` içinde, `try {` bloğunun hemen başında (deep-dive `for` döngüsünden önce) fakt-sayfasını üret ve gönder:

```ts
      // Fakt-sayfası ön-geçişi (deep-dive'dan ÖNCE, tek seferlik grounded çağrı)
      let factSheet: FactSheet | null = null
      try {
        factSheet = await buildFactSheet(productClean, countryClean)
        send({ type: 'fact_sheet', factSheet })
      } catch (fsErr) {
        console.error('[report] fact-sheet build failed:', fsErr)
        // Rapor yine de devam eder; bölümler fakt-sayfası olmadan "doğrulanmalı" politikasıyla yazar.
      }
```

`for` döngüsü içindeki `ctx` oluşturmayı güncelle (mevcut `const ctx: PromptContext = {...}` bloğu):

```ts
          const ctx: PromptContext = attachFactSheet(
            { selectedCountry: countryClean, previousSections },
            factSheet,
          )
```

- [ ] **Step 5: Fakt-sayfasını rapor kaydına ekle**

Aynı dosyada `const insert = {...}` objesine alan ekle:

```ts
            fact_sheet: factSheet,
```

> DB: `reports` tablosunda `fact_sheet jsonb null` kolonu gerekiyorsa migration ekle (Supabase). Kolon yoksa insert hata vermesin diye: `...(factSheet ? { fact_sheet: factSheet } : {})`. Migration ayrı PR'da; bu task'ta opsiyonel alan olarak gönder.

- [ ] **Step 6: Tip + suite kontrolü**

Run: `npx tsc --noEmit`
Expected: hata yok.
Run: `npm test`
Expected: tüm suite yeşil.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/report/route.ts src/app/api/report/fact-sheet-context.ts src/__tests__/lib/grounding/route-wiring.test.ts
git commit -m "feat(grounding): /api/report fakt-sayfası ön-geçişi entegrasyonu + persist"
```

---

## Task 11: Uçtan-Uca Doğrulama (manuel + build)

**Files:** (yok — doğrulama)

- [ ] **Step 1: Tüm test suite**

Run: `npm test`
Expected: tüm testler yeşil; özellikle yeni `grounding/*` testleri.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: derleme başarılı, tip hatası yok.

- [ ] **Step 3: Manuel smoke (dev)**

Run: `npm run dev` → giriş yap → "organik zeytinyağı" → ülke "Almanya" seç → raporu üret.
Doğrula:
- GTİP **1509** (1510 değil), "Doğrulandı" etiketiyle.
- Gümrük: CAP/tarım rejimi, "%0 Gümrük Birliği" iddiası YOK.
- Japonya STA gibi uydurma anlaşma YOK (yoksa "doğrulanmalı/yok").
- Fiyat bandı ~6.5–7.5 USD civarı, "Tahmini" etiketiyle.
- "el işçiliği" tabiri YOK.

- [ ] **Step 4: Spec changelog + final commit**

`docs/superpowers/specs/2026-06-06-grounding-fact-sheet-design.md` §9 altına "Uygulandı: <tarih>, <commit aralığı>" notu ekle.

```bash
git add docs/superpowers/specs/2026-06-06-grounding-fact-sheet-design.md
git commit -m "docs(grounding): alt-proje #1 uygulandı — changelog"
```

- [ ] **Step 5: (🛑 checkpoint) PR / merge onayı**

PR aç (`feat/grounding-fact-sheet` → `main`). **Outward-facing değişiklik (canlı rapor davranışı) — merge öncesi Umut onayı gerekir.** Onay alınmadan merge etme.

---

## Notlar & Bağımlılıklar

- **HS veri seti (Task 1):** datahub.io harmonized-system (CC-BY). Erişilemezse manuel CSV fallback (Task 1 Step 2 notu).
- **Perplexity recency (Task 5):** OpenRouter `search_recency_filter`'ı yok sayabilir → tarih çıpası (Task 4) ikinci savunma.
- **DB kolonu (Task 10):** `reports.fact_sheet jsonb` opsiyonel; migration ayrı.
- **#2'ye köprü:** `factSheet.category` alanı şimdilik kaba; ürün-kategori taksonomisi #2'de bu alanı besleyecek.
- **#4'e köprü:** fakt-sayfası, ileride yayını bloklayan fakt-doğrulama post-pass'ın girdisi olacak.
