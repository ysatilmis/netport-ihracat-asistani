export type PositioningSectionKey = 'usp' | 'personas' | 'product_description' | 'cold_email'

export interface PositioningSection {
  key: PositioningSectionKey
  title: string
  emoji: string
  buildPrompt: (ctx: PositioningContext) => string
}

export interface PositioningContext {
  product: string
  country: string
  targetLanguage: string
  languageLabel: string
  marketSummary: string
  previousSections: Partial<Record<PositioningSectionKey, string>>
}

/**
 * Ülke → ISO 639-1 hedef dil + insan-okur label. Hedef ülkede iş yapan
 * alıcılarla iletişimde kullanılacak dil.
 */
const COUNTRY_LANGUAGE_MAP: Record<string, { code: string; label: string }> = {
  'almanya': { code: 'de', label: 'Almanca (Deutsch)' },
  'avusturya': { code: 'de', label: 'Almanca (Deutsch)' },
  'isviçre': { code: 'de', label: 'Almanca (Deutsch)' },
  'fransa': { code: 'fr', label: 'Fransızca (Français)' },
  'belçika': { code: 'fr', label: 'Fransızca (Français)' },
  'amerika birleşik devletleri': { code: 'en', label: 'İngilizce (English)' },
  'abd': { code: 'en', label: 'İngilizce (English)' },
  'birleşik krallık': { code: 'en', label: 'İngilizce (English)' },
  'i̇ngiltere': { code: 'en', label: 'İngilizce (English)' },
  'ingiltere': { code: 'en', label: 'İngilizce (English)' },
  'kanada': { code: 'en', label: 'İngilizce (English)' },
  'avustralya': { code: 'en', label: 'İngilizce (English)' },
  'i̇spanya': { code: 'es', label: 'İspanyolca (Español)' },
  'ispanya': { code: 'es', label: 'İspanyolca (Español)' },
  'meksika': { code: 'es', label: 'İspanyolca (Español)' },
  'i̇talya': { code: 'it', label: 'İtalyanca (Italiano)' },
  'italya': { code: 'it', label: 'İtalyanca (Italiano)' },
  'hollanda': { code: 'nl', label: 'Felemenkçe (Nederlands)' },
  'rusya': { code: 'ru', label: 'Rusça (Русский)' },
  'çin': { code: 'zh', label: 'Mandarin Çincesi (中文)' },
  'japonya': { code: 'ja', label: 'Japonca (日本語)' },
  'kore': { code: 'ko', label: 'Korece (한국어)' },
  'güney kore': { code: 'ko', label: 'Korece (한국어)' },
  'suudi arabistan': { code: 'ar', label: 'Arapça (العربية)' },
  'birleşik arap emirlikleri': { code: 'ar', label: 'Arapça (العربية)' },
  'bae': { code: 'ar', label: 'Arapça (العربية)' },
  'katar': { code: 'ar', label: 'Arapça (العربية)' },
  'mısır': { code: 'ar', label: 'Arapça (العربية)' },
  'hindistan': { code: 'en', label: 'İngilizce (English)' },
  'brezilya': { code: 'pt', label: 'Portekizce (Português)' },
  'portekiz': { code: 'pt', label: 'Portekizce (Português)' },
  'polonya': { code: 'pl', label: 'Lehçe (Polski)' },
}

export function detectTargetLanguage(country: string): { code: string; label: string } {
  const normalized = country.trim().toLowerCase()
  return (
    COUNTRY_LANGUAGE_MAP[normalized] ?? {
      code: 'en',
      label: 'İngilizce (English)',
    }
  )
}

function previousBlock(
  prev: Partial<Record<PositioningSectionKey, string>>,
  keys: PositioningSectionKey[],
): string {
  const blocks = keys
    .filter((k) => prev[k]?.trim())
    .map((k) => `### ${POSITIONING_TITLES[k]}\n${prev[k]!.trim()}`)
  if (blocks.length === 0) return ''
  return [
    '',
    '## ÖNCEKİ ÇIKTILAR (referans al, tekrar etme)',
    ...blocks,
    '---',
    '',
  ].join('\n\n')
}

const POSITIONING_TITLES: Record<PositioningSectionKey, string> = {
  usp: 'USP — Eşsiz Değer Önerisi',
  personas: 'Hedef Alıcı Persona\'ları',
  product_description: 'Ürün Açıklaması (Hedef Dilde)',
  cold_email: 'Cold Email Taslağı (Hedef Dilde)',
}

export const POSITIONING_SECTIONS: PositioningSection[] = [
  {
    key: 'usp',
    title: POSITIONING_TITLES.usp,
    emoji: '🎯',
    buildPrompt: (ctx) => `
Sen B2B konumlandırma ve değer önerisi uzmanısın. Kısa, çakıcı, kanıtlanmış USP'ler yazarsın.

## Bağlam
- Ürün: **${ctx.product}**
- Hedef pazar: **${ctx.country}**
- Hedef dil (sonraki bölümler için): ${ctx.languageLabel}

## Hedef pazar özeti (referans)
${ctx.marketSummary.slice(0, 1500)}

## Görev
"${ctx.product}" için **${ctx.country}** pazarında konumlandırma kurgusu çıkar:

1. **Ana USP cümlesi** (TR) — Tek cümle, 18 kelimeyi geçmesin. "X için Y'den farklı olarak Z" formülüne yakın. Spesifik avantaj + somut hedef + ölçülebilir fark.
2. **3 destekleyici sütun** — Her biri 1-2 cümle. Kanıt + farklılık + alıcı yararı.
3. **3 yanlış-pozitif** — Bu USP'yi yazarken kaçınılması gereken klişeler (örn. "kaliteli", "uygun fiyatlı", "en iyi"). Sebep belirt.
4. **Mesaj-pazar uyumu skoru** (1-10) — Kendi USP'nin ${ctx.country} pazarına uyumunu skorla, 1 cümle gerekçe.

## Çıktı Formatı
### Ana USP
> "<tek cümle, 18 kelime altı>"

### Destekleyici Sütunlar
1. **<sütun adı>** — <gerekçe>
2. ...
3. ...

### Kaçınılacak Klişeler
- ❌ <klişe> — <sebep>
- ❌ ...
- ❌ ...

### Mesaj-Pazar Uyumu
**Skor:** <1-10>/10 — <tek cümle gerekçe>

YAPMA: pazarlama saçmalığı, jenerik laf, kanıtsız iddia.`.trim(),
  },

  {
    key: 'personas',
    title: POSITIONING_TITLES.personas,
    emoji: '👤',
    buildPrompt: (ctx) => `
Sen B2B alıcı persona uzmanısın. Ölçülebilir, satın alma davranışına odaklanan personalar yazarsın.

## Bağlam
- Ürün: **${ctx.product}**
- Hedef pazar: **${ctx.country}**
${previousBlock(ctx.previousSections, ['usp'])}

## Görev
"${ctx.product}" için **${ctx.country}** pazarında **3 farklı alıcı persona** çıkar. Hepsi B2B (ithalatçı / distribütör / büyük perakende zinciri / e-ticaret platformu / HORECA toptan). Bireysel tüketici değil.

Her persona için zorunlu alanlar:

1. **Rol & Şirket Tipi** — "Satın alma müdürü @ <şirket tipi>"
2. **Yıllık Alım Bütçesi** — USD aralığı, kanıt/varsayım belirt
3. **Acı Noktası** — Bu ürün kategorisinde şu an çektiği derdi 1-2 cümlede
4. **Karar Tetikleyicisi** — Hangi sinyali görürse "evet" der (fiyat, hacim, sertifika, lojistik süresi vb.)
5. **Kanal** — Nerede bulunur (LinkedIn, sektör fuarı, ticaret odası, alibaba, importgenius vb.)
6. **Mesaj Yaklaşımı** — TR cümle: "Bu personaya yazarken X yapmalı, Y yapmamalı"

## Çıktı Formatı
### Persona 1: <rol>
- **Şirket Tipi:** ...
- **Yıllık Alım Bütçesi:** ...
- **Acı Noktası:** ...
- **Karar Tetikleyicisi:** ...
- **Kanal:** ...
- **Mesaj Yaklaşımı:** ...

### Persona 2: <rol>
...

### Persona 3: <rol>
...

### Tavsiye Edilen Birinci Persona
**<rol>** — Tek cümle gerekçe (USP ile en güçlü eşleşme).

YAPMA: jenerik "büyük şirket karar verici" tarifi, kanıtsız bütçe rakamları, kanalları boş geçme.`.trim(),
  },

  {
    key: 'product_description',
    title: POSITIONING_TITLES.product_description,
    emoji: '📦',
    buildPrompt: (ctx) => `
Sen ihracata yönelik ürün açıklaması copywriter'sın. Hedef pazarın diline ve kültürüne uygun yazarsın.

## Bağlam
- Ürün: **${ctx.product}**
- Hedef pazar: **${ctx.country}**
- **Yazılacak dil:** ${ctx.languageLabel}
${previousBlock(ctx.previousSections, ['usp', 'personas'])}

## Görev
"${ctx.product}" için **${ctx.country}** alıcılarına hitap eden bir B2B ürün açıklaması yaz.

**KRİTİK KURAL:** Tüm açıklama metni **${ctx.languageLabel}** dilinde yazılmalı. Türkçe karışmasın. Sadece bölüm başlıkları + meta notlar Türkçe olabilir.

Yapı:
1. **Headline (hero satırı)** — 8-12 kelime, ${ctx.languageLabel} dilinde. USP'yi yansıtsın.
2. **Açıklama (200-280 kelime)** — ${ctx.languageLabel}. 4-5 paragraf. Acı noktası → çözüm → kanıt → fark.
3. **Teknik Özellikler (5-7 madde)** — ${ctx.languageLabel}. Ürün spesifikasyonları, sertifika, lojistik bilgisi.
4. **MOQ ve Sevkiyat Notu** — 2-3 satır, ${ctx.languageLabel}.

## Çıktı Formatı
### Headline
> <${ctx.languageLabel} headline>

### Açıklama
<4-5 paragraf ${ctx.languageLabel} metin>

### Teknik Özellikler
- <özellik 1>
- ...
- <özellik 5-7>

### MOQ & Sevkiyat
<2-3 satır ${ctx.languageLabel}>

### TR Özet (kontrol amaçlı)
> Yukarıdaki metni 3 cümlede Türkçe özetle.

YAPMA: Türkçe karıştırma (TR özet kısmı hariç), kanıtsız iddia, abartılı sıfat.`.trim(),
  },

  {
    key: 'cold_email',
    title: POSITIONING_TITLES.cold_email,
    emoji: '✉️',
    buildPrompt: (ctx) => `
Sen B2B outreach uzmanısın. Soğuk e-postalar kısa, kişisel, satış-vurguncu olmayan tonda olmalı.

## Bağlam
- Ürün: **${ctx.product}**
- Hedef pazar: **${ctx.country}**
- **E-postanın dili:** ${ctx.languageLabel}
${previousBlock(ctx.previousSections, ['usp', 'personas', 'product_description'])}

## Görev
${ctx.country}'da seçtiğin **birinci persona**'ya hitap eden 2 farklı **cold email taslağı** yaz.

**KRİTİK KURAL:** Tüm e-posta gövdesi **${ctx.languageLabel}** dilinde. Türkçe yalnızca açıklayıcı notlarda.

Her e-posta için:
- **Konu satırı** (subject) — ${ctx.languageLabel}, max 7 kelime, açılma cazibesi yüksek.
- **Açılış cümlesi** — kişiselleştirme placeholder'ı ile (örn. {{first_name}}, {{company_name}}).
- **Gövde** — 80-130 kelime ${ctx.languageLabel}. Acı noktası → fark → somut teklif → düşük taahhütlü CTA.
- **CTA** — Tek bir net eylem (15 dk görüşme / numune talebi / katalog gönderimi).
- **İmza bloğu** — placeholder'lı.

İki versiyon farkı: **Versiyon A** doğrudan "USP-first", **Versiyon B** "alıcı-acısı-first" yaklaşımı.

## Çıktı Formatı

### Versiyon A — USP-First
**Subject:** <${ctx.languageLabel}>

<${ctx.languageLabel} e-posta gövdesi, paragraf yapısıyla>

---

### Versiyon B — Acı-Noktası-First
**Subject:** <${ctx.languageLabel}>

<${ctx.languageLabel} e-posta gövdesi>

---

### A/B Test Notu
TR: <hangi versiyonu önce yolla, ne sinyali bekle, kaç gün>

### Follow-up Şablonu (4 iş günü sonra)
**Subject:** Re: <önceki konu>

<${ctx.languageLabel} 40-60 kelime kısa follow-up>

YAPMA: spam tonlu cümle, "Hi I hope this finds you well", uzun paragraf, çoklu CTA, abartı sıfat.`.trim(),
  },
]

export const POSITIONING_SECTION_MAP: Record<PositioningSectionKey, PositioningSection> =
  POSITIONING_SECTIONS.reduce(
    (acc, s) => {
      acc[s.key] = s
      return acc
    },
    {} as Record<PositioningSectionKey, PositioningSection>,
  )
