# Grounding & Fakt-Sayfası Ön-Geçişi — Tasarım Spec'i

**Tarih:** 2026-06-06
**Alt-proje:** #1/5 (Tam Yeniden Mimari — Grounding & Model Yönlendirme)
**Durum:** Onaylandı, uygulama planı bekliyor
**Proje:** netport-ihracat-asistani

---

## 1. Bağlam & Problem

Bir sektör uzmanı, sistemin ürettiği bir zeytinyağı ihracat raporunu denetledi ve ciddi
fakt hataları buldu:

1. **GTİP kodu yanlış:** 1510 (prina/posa yağı) verilmiş, doğrusu 1509 (zeytinyağı).
2. **Gümrük rejimi yanlış:** "Zeytinyağı Gümrük Birliği'nde %0 ile AB'ye girer" denmiş —
   yanlış. Zeytinyağı Ortak Tarım Politikası (CAP) kapsamında, sanayi malı gibi
   serbest değil.
3. **Uydurma anlaşma:** "Japonya ile STA var" denmiş — yok.
4. **Fiyat yanlış:** $5 yazılmış, güncel ambalajlı zeytinyağı ihraç fiyatı ort. $6.5–7
   (organikte daha yüksek).
5. **Sektöre uymayan dil:** "El işçiliği" — zeytinyağında olmayan bir tabir.
6. **Eksik içerik:** Rapor organik odaklı ama AB organik pazarına giriş belgeleri/aşamaları
   (Reg. 2018/848, kontrol kuruluşu, COI/TRACES) hiç geçmiyor.
7. **Düşen iplikler:** Başta ABD ve Japonya hedef gösterilip devamında hiç bahsedilmemiş.

### Kök neden — üç katman

- **Katman 1 (prompt, ~%40):** [report-prompts.ts:150 ve :219](../../../src/lib/report-prompts.ts)
  satırlarındaki kural — *"Kesin veri yoksa proxy tahmin ver, 'veri yok' yazma.
  Tahminlerini ⚠ ile işaretleme, raporu zayıf gösterir."* — modele **belirsizliği
  gizleyip güvenle uydurmasını** emrediyor. Ayrıca [satır 393](../../../src/lib/report-prompts.ts)
  "el işçiliği"ni örnek olarak promptun içine gömüyor (domain sızıntısı). Ürün sadece
  serbest metin; kategori farkındalığı sıfır.
- **Katman 2 (mimari, en ağır):** Fakt-kritik bölümler — `legal_customs` (GTİP/tarife)
  ve `price_strategy` (gerçek fiyat) — **web erişimi olmayan GPT-4o'ya** yönlendirilmiş.
  11 bölümden yalnız 2'si grounded model (Perplexity) kullanıyor. Fakt-kritik veriler
  modelin parametrik hafızasından üretiliyor = halüsinasyon.
- **Katman 3 (doğrulama yok):** [quality-check.ts](../../../src/lib/quality-check.ts) var
  ama Haiku'da çalışan **stilistik** bir eleştirmen; web erişimi yok, "GTİP yanlış" /
  "Japonya STA yok" gibi fakt hatalarını yapısal olarak yakalayamaz.

### Gap-scan ek bulguları

- **G1:** [positioning-prompts.ts](../../../src/lib/positioning-prompts.ts) ikinci bir
  prompt yüzeyi (`/api/positioning`). Aynı grounding/honesty eksikliği — persona "Yıllık
  Alım Bütçesi USD" uyduruyor.
- **G2:** Hiçbir promptta tarih çıpası yok; Perplexity çağrılarında recency parametresi
  geçilmiyor ([llm/index.ts:37](../../../src/lib/llm/index.ts)).
- **G3:** [lead-finder.ts](../../../src/lib/lead-finder.ts) Perplexity kullanıyor ama
  firma/URL gerçekliğini doğrulamıyor.
- **G4:** [extract-countries-claude.ts:13](../../../src/lib/extract-countries-claude.ts)
  skor uyduruyor ("metinde yoksa 6-9 arası tahmin koy").

---

## 2. Hedefler & Hedef-Dışı

### Hedefler (bu alt-proje #1)

1. Fakt-kritik veriyi (GTİP, gümrük rejimi, STA durumu, fiyat bandı, zorunlu sertifikalar)
   **tek yetkili kaynaktan** — grounded fakt-sayfasından — üret.
2. GTİP'i **tüm ürünlerde** doğru çöz: gömülü HS nomenklatür + deterministik validasyon.
3. **Her zaman güncel** veri: tarih çıpası + Perplexity recency + veri-yılı confidence.
4. Belirsizlik-yasağı kuralını kaldırıp **iki katmanlı güven etiketi** politikasıyla değiştir.
5. Hem `report-prompts` hem `positioning-prompts` prompt yüzeylerini temizle.

### Hedef-dışı (sonraki alt-projeler)

- Ürün-kategori taksonomisi & sınıflandırma → **#2**
- Koşullu organik/CAP bölüm mantığı (organik konum → organik sertifika bölümü) → **#3**
- Yayını bloklayan fakt-doğrulama post-pass + lead/URL gerçeklik kontrolü → **#4**
- Bölümler-arası tutarlılık motoru (düşen iplik #7) → **#5**

> Not: #1 fakt-sayfasında organik sertifika gereksinimini **yüzeye çıkarır** (alan olarak),
> ama ayrı koşullu bölüm üretimi #3'tedir.

---

## 3. Mimari & Veri Akışı

Fakt-sayfası ön-geçişi `/api/report` route'unda, ülke seçildikten sonra ve deep-dive
döngüsünden **önce** çalışır.

```
Kullanıcı ülkeyi seçti  →  POST /api/report
   │
   ▼
[1] FAKT-SAYFASI ÖN-GEÇİŞİ  (yeni, tek seferlik)
   ├─ a) GTİP çözücü:
   │     • Gömülü HS nomenklatür lookup (ürün → aday başlık)
   │     • Hızlı yol: küçük "yaygın TR ihracı" kısayol tablosu (en yüksek confidence)
   ├─ b) Perplexity grounded çağrı (recency-kısıtlı):
   │     • Deterministik faktlar YETKİLİ olarak verilir
   │     • Model ülkeye-özgü alanları doldurur: fiyat bandı, TR↔ülke STA,
   │       sertifikalar, veri yılı — her alana confidence + kaynak
   │     • Uydurma YASAK; bilinmiyorsa "Doğrulanmalı"
   ├─ c) GTİP validasyonu: model önerisi gömülü nomenklatürle çapraz kontrol
   │     (kod var mı? açıklama ürünle eşleşiyor mu? 1510≠zeytinyağı yakalanır)
   └─ d) Merge: deterministik (Doğrulandı) alanlar modeli ezer + veri-yılı
         confidence düşürmesi uygulanır
   │
   ▼
[2] Fakt-sayfası "## DOĞRULANMIŞ FAKT SAYFASI" bloğu olarak
    HER deep-dive bölüm promptuna enjekte edilir (tek doğruluk kaynağı)
   │
   ▼
[3] 10 deep-dive bölüm (GPT-4o/Claude): fakt UYDURMAZ, etiketli veriyle YAZAR
   │
   ▼
[4] Fakt-sayfası rapor kaydına eklenir (denetim izi)
```

**Latency:** Tek ekstra Perplexity çağrısı (~5–15s). Route `maxDuration = 300s`, bütçe rahat.

---

## 4. Bileşenler

Her bileşen tek sorumlu, izole edilebilir, bağımsız test edilebilir.

### 4.1 HS/GTİP Nomenklatür Veri Seti + Çözücü/Validatör

**Dosya:** `src/lib/grounding/gtip-nomenclature.ts` (veri) + `gtip-resolver.ts` (mantık)

- **Veri:** Uluslararası Armonize Sistem (HS), Fasıl 1–97, 4 ve 6 haneli başlıklar +
  açıklamaları. Bundle'lı JSON (~5.600 kalem). HS6 uluslararası standart ve stabildir;
  son haneler (TR ulusal GTİP) detaylandırır ama gümrük rejimini belirleyen Fasıl/Başlık
  4–6 hanede.
- **Çözücü API:**
  - `resolveGtip(product: string): GtipCandidate[]` — gömülü nomenklatürde anahtar-kelime
    eşleşmesiyle aday başlık(lar) döner.
  - `validateGtip(code: string, product: string): { valid: boolean; description: string;
    chapter: number; mismatch?: string }` — model önerisini doğrular. Açıklama ürünle
    çelişiyorsa `mismatch` doldurulur (ör. kod=1510 açıklama="prina/posa yağı",
    ürün="zeytinyağı" → mismatch).
  - `customsRegimeFromChapter(chapter: number): 'industrial' | 'agricultural_cap' | 'other'`
    — Fasıl numarasından deterministik rejim (Fasıl 1–24 ≈ tarım/CAP).
- **Hızlı yol tablosu:** En yaygın TR ihraç ürün aileleri (zeytinyağı→1509, kuru
  meyve, fındık, bakliyat, tekstil, mermer...) elle doğrulanmış kısayol — en yüksek
  confidence, ilk bakılan yer.

### 4.2 Fakt-Sayfası Şeması

**Dosya:** `src/lib/grounding/fact-sheet.ts` (tipler)

```ts
export type Confidence = 'verified' | 'estimated' | 'unverified'
// UI etiketleri: Doğrulandı / Tahmini / Doğrulanmalı

export interface Fact<T> {
  value: T
  confidence: Confidence
  source?: string      // "TradeMap 2026", "Eurostat 2025", "HS nomenklatür"
  dataYear?: number    // recency confidence düşürmesi için
}

export interface FactSheet {
  product: string
  country: string
  generatedAt: string          // ISO — recency çıpası

  category: Fact<string>       // kaba kategori (#2'de formalize)
  gtip: Fact<{ code: string; description: string; chapter: number }>
  customsRegime: Fact<{
    type: 'industrial' | 'agricultural_cap' | 'other'
    euTreatment: string        // "CAP kapsamı — serbest değil; tarife kotası uygulanabilir"
    tariffMfn?: string
    trPreferential?: string
    originDoc?: string         // ATR.1 / EUR.1
  }>
  fta: Fact<{ exists: boolean; agreementName?: string }>  // TR ↔ hedef ülke
  priceBand: Fact<{ low: number; high: number; currency: string; unit: string; basis: string }>
  mandatoryCerts: Fact<Array<{ name: string; regime: string; note?: string }>>

  warnings: string[]           // validasyon/merge sırasında oluşan notlar
}
```

### 4.3 Fakt-Sayfası Builder

**Dosya:** `src/lib/grounding/fact-sheet-builder.ts`

`buildFactSheet(product, country): Promise<FactSheet>`

Adımlar:
1. **Deterministik tohum:** hızlı-yol tablosu + `resolveGtip` → GTİP & rejim alanlarını
   `verified` ile doldur.
2. **Grounded çağrı:** Perplexity sonar-pro, recency-kısıtlı (§4.4). Sistem promptu:
   deterministik faktları YETKİLİ ver, kalanları (fiyat bandı, ülke STA, sertifikalar,
   veri yılı) doldur, her alana confidence+kaynak+yıl, **uydurma yasak → bilinmiyorsa
   `unverified`**. Çıktı: katı JSON.
3. **GTİP validasyonu:** modelin (veya tohumun) GTİP'i `validateGtip` ile çapraz kontrol;
   mismatch varsa düzelt + `warnings`'e yaz, confidence düşür.
4. **Merge & recency:** deterministik alanlar modeli ezer; `dataYear` 18 aydan eskiyse
   `verified→estimated`. `generatedAt` damgalanır.
5. Hata → graceful degradation (§6).

### 4.4 Recency Katmanı

**Dosya:** `src/lib/grounding/recency.ts`

- `buildDateAnchor(): string` — "Bugün {ISO tarih}, cari yıl 2026. En güncel veriyi
  öncele; 2024/2025 verisini ancak daha yenisi yoksa kullan ve veri yılını etiketle."
  Tüm grounded promptlara (fakt-sayfası, market-signal, lead-finder, target_countries)
  enjekte edilir.
- **Perplexity recency parametresi:** [llm/index.ts](../../../src/lib/llm/index.ts)
  `callLLMStream` + grounded `generateText` çağrılarına OpenRouter provider option ile
  `search_recency_filter` (year/month) geç. Desteklenmiyorsa tarih çıpası tek başına devrede.
- **Veri-yılı confidence:** §4.3 adım 4.

### 4.5 Fakt-Sayfası Enjeksiyonu

**Dosya:** `src/lib/report-prompts.ts` (helper güncellemesi)

`renderFactSheetBlock(fs: FactSheet): string` — "## DOĞRULANMIŞ FAKT SAYFASI
(yetkili kaynak — bunları AYNEN kullan; çelişme, uydurma; güven etiketini koru)" bloğu.
Her fakt değer + etiket (`[Doğrulandı: kaynak, yıl]` / `[Tahmini: dayanak]` /
`[Doğrulanmalı — gümrük müşaviri]`) ile basılır. `buildPrompt(product, ctx)` imzasına
fakt-sayfası `ctx` üzerinden taşınır; route enjekte eder.

### 4.6 Prompt Cerrahisi (`/prompt-duzelt` ile)

**Dosyalar:** `report-prompts.ts` (11 bölüm) + `positioning-prompts.ts` (4 bölüm)

- **Sil:** `SOMUTLASTIRMA` ve her "Kalite Kuralları"ndaki belirsizlik-yasağı cümleleri
  (satır 150/219 ve eşleri).
- **Ekle (honesty politikası):** "Fakt sayfasındaki güven etiketini koru. 'Doğrulanmalı'
  etiketli veriyi kesinmiş gibi yazma — etiketiyle aktar. Fakt sayfasında olmayan sayısal
  iddia ÜRETME; gerekirse 'Doğrulanmalı' işaretle veya satırı atla."
- **`legal_customs` & `price_strategy`:** GTİP/tarife/fiyatı **fakt sayfasından al**,
  uydurma. GTİP için "12 hane tahmin et" yerine "fakt sayfasındaki kodu kullan".
- **`usp_positioning`:** "el işçiliği" örneğini kaldır (tam kategori-farkındalık #2).
- **positioning-prompts:** persona bütçesi/sayısal iddialara aynı honesty politikası;
  tarih çıpası.

### 4.7 target_countries Customs Yumuşatma

Japonya STA hatası ülke-seçim aşamasında (fakt-sayfasından önce) oluşuyor.
- `customs_advantage` alanı zorla STA etiketi dayatmasın; "Doğrulanmalı / yok"
  kabul edilsin. Mümkünse hızlı-yol tablosuna danış.
- [extract-countries-claude.ts](../../../src/lib/extract-countries-claude.ts) skor
  uydurma talimatı yumuşatılsın (G4).

---

## 5. Route Entegrasyonu

[src/app/api/report/route.ts](../../../src/app/api/report/route.ts):
- Kredi/validation sonrası, `ReadableStream` `start` içinde, deep-dive döngüsünden önce:
  `const factSheet = await buildFactSheet(productClean, countryClean)`.
- SSE event: `{ type: 'fact_sheet', factSheet }` (UI ileride gösterebilir; #1'de en
  azından kaydedilir).
- `ctx.factSheet = factSheet` her `buildPrompt` çağrısına geçer; `renderFactSheetBlock`
  context bloğunun başına enjekte edilir.
- Kayıt: `report_sections`/insert payload'ına `fact_sheet` JSON eklenir.

---

## 6. Hata Yönetimi

- **Fakt-sayfası çağrısı başarısız:** rapor durmaz. Deterministik tohum (GTİP/rejim)
  yine de enjekte edilir; grounded alanlar `unverified` olarak işaretlenir; `warnings`'e
  "fakt-sayfası kısmi" notu. Promptlar zaten "Doğrulanmalı" politikasıyla güvenli davranır.
- **GTİP çözülemez (nadir ürün):** `gtip.confidence = 'unverified'`, açıklama "GTİP gümrük
  müşaviriyle doğrulanmalı".
- **Perplexity recency param desteklenmiyor:** tarih çıpası tek başına devrede; sessiz
  fallback.

---

## 7. Test Stratejisi

Mevcut: [src/__tests__/lib/prompts.test.ts](../../../src/__tests__/lib/prompts.test.ts).

- **gtip-resolver:** `validateGtip('1510','zeytinyağı')` → mismatch; `resolveGtip('zeytinyağı')`
  → 1509; `customsRegimeFromChapter(15)` → 'agricultural_cap'. Birkaç ürün ailesi golden test.
- **fact-sheet-builder:** merge önceliği (deterministik > model); veri-yılı confidence
  düşürmesi; çağrı hatasında graceful tohum (mock Perplexity).
- **renderFactSheetBlock:** etiketler doğru basılıyor; "Doğrulanmalı" görünür.
- **recency:** tarih çıpası cari yılı içeriyor.
- **regresyon:** belirsizlik-yasağı ifadeleri promptlarda artık YOK (string assert);
  "el işçiliği" usp_positioning'de YOK.
- **(opsiyonel) golden eval:** "organik zeytinyağı → Almanya" fakt-sayfası → gtip 1509*,
  rejim agricultural_cap, fta uydurulmamış.

---

## 8. Bağımlılıklar & Açık Sorular

- HS nomenklatür veri setinin kaynağı/formatı: bundle JSON olarak repoya eklenecek
  (uygulama planında kesinleşir; lisans/atıf kontrol edilecek).
- OpenRouter'ın Perplexity `search_recency_filter` provider-option desteği uygulamada
  doğrulanacak; desteklenmezse §6 fallback.
- OpenRouter Perplexity recency desteği belirsizse §6 fallback devrede.

## 9. Bağımsız Gap-Scan Notu

Codex bağımsız tarama için tetiklendi ancak çalışamadı (Codex runtime'ı destekleyen
ChatGPT hesabı/model yapılandırması sorunu — görevle ilgili değil). Yeniden yetkilendirme
sonrası aynı tarama tekrar gönderilebilir. Bu spec'in gap kapsamı, §1.3'teki kendi
elle taramama (G1–G4) dayanır; ek bağımsız bulgu beklenirse uygulama öncesi tekrar
denenebilir.
