export type LLMModel = 'perplexity' | 'openai' | 'claude'

export interface PreviousSection {
  title: string
  text: string
}

export interface PromptContext {
  selectedCountry?: string
  previousSections: Record<string, PreviousSection>
}

export interface ReportSection {
  key: string
  title: string
  phase: 1 | 2 | 3 | 4
  model: LLMModel
  buildPrompt: (product: string, ctx: PromptContext) => string
}

// ─────────────────────────────────────────────────────────────────────────
// Helper: önceki section'ları "## ÖNCEKİ ANALİZ" bloğu olarak inject eder.
// includeKeys: hangi önceki bölümler bağlam olarak verilecek.
// ─────────────────────────────────────────────────────────────────────────
function buildContextBlock(ctx: PromptContext, includeKeys: string[]): string {
  const blocks = includeKeys
    .filter((k) => ctx.previousSections[k])
    .map(
      (k) =>
        `### ${ctx.previousSections[k].title}\n${ctx.previousSections[k].text.trim()}`,
    )
  if (blocks.length === 0) return ''
  return [
    '',
    '## ÖNCEKİ ANALİZ BULGULARI (referans al — çelişki yaratma, tekrar etme)',
    ...blocks,
    '---',
    '',
  ].join('\n\n')
}

// Birinci öncelikli ülkeyi çıktıdan ayıklar.
// target_countries promptu çıktının son satırında "SECILEN_ULKE: X" yazar.
export function extractSelectedCountry(text: string): string | undefined {
  const m = text.match(/SECILEN_ULKE:\s*([^\n\r]+)/i)
  if (!m) return undefined
  return m[1].trim().replace(/[.*_`]/g, '').trim() || undefined
}

// ─────────────────────────────────────────────────────────────────────────
// PROMPT'LAR — /prompt-duzelt + zincirleme bağlam
// Her bölüm önceki ilgili bölümleri referans alır.
// ─────────────────────────────────────────────────────────────────────────

export const REPORT_SECTIONS: ReportSection[] = [
  // ═══ FAZ 1: ARAŞTIRMA & HAZIRLIK ═══════════════════════════════════════

  {
    key: 'target_countries',
    title: 'Hedef 3 Ülke Belirleme',
    phase: 1,
    model: 'perplexity',
    buildPrompt: (product) => `
Sen Türkiye'den ihracat yapan KOBİ'lere danışmanlık veren kıdemli bir pazar analistisin. Kaynak göstermeden iddia üretmezsin.

## Bağlam
Türk üreticisi "${product}" ürününü yurt dışına ihraç edecek. Hangi ülke en uygun, henüz seçilmedi — sen önereceksin.

## Görev
"${product}" için en uygun 3 ihracat pazarını belirle ve karşılaştır.

Her ülke için zorunlu alanlar:
1. **Yıllık ithalat hacmi** — son 12 ay USD, kaynak ve yıl belirt (TradeMap / ITC / Eurostat / TÜİK).
2. **Türkiye'nin mevcut payı** — yüzde + sıralama (örn. "Türkiye 7. büyük tedarikçi, %4.2 pay").
3. **Gümrük avantajı** — AB Gümrük Birliği / STA / GTS durumu, ATR.1 veya EUR.1 belge geçerliliği, indirimli tarife oranı.
4. **3 maddelik avantaj listesi** — neden bu ülke.
5. **Lojistik kolaylığı** — İstanbul'a uzaklık, tipik konteyner transit süresi, ortalama FCL maliyet bandı (USD/40HC).

## Çıktı Formatı (aynen uygula)
### Hedef 3 Ülke
\`\`\`
| Ülke | İthalat Hacmi (USD/yıl) | TR Payı | Gümrük Avantajı | Lojistik | Genel Puan (1-10) |
\`\`\`

### Detaylı Değerlendirme
Her ülke için yukarıdaki 5 maddeyi alt başlıklarla aç.

### Sonuç ve Tavsiye
- **Birinci öncelik:** [ülke] — 3 cümlede gerekçe.
- **İkinci öncelik:** [ülke] — 2 cümle.
- **Üçüncü öncelik:** [ülke] — 2 cümle.

## ZORUNLU SON SATIR
Tüm çıktının en son satırı, başka hiçbir şey olmadan, aynen şu formatta olacak:

SECILEN_ULKE: [birinci öncelikli ülke adı, sadece ülke ismi]

## Kalite Kuralları
- Her sayısal veriye \`[Kaynak: ad, yıl]\` ekle.
- Spekülasyon yasak — kaynak yoksa "veri bulunamadı" yaz.
- Genel ifade ("büyük pazar", "iyi fırsat") yasak; her iddia somut sayıyla.
`.trim(),
  },

  {
    key: 'market_size_growth',
    title: 'Pazar Büyüklüğü & Büyüme',
    phase: 1,
    model: 'perplexity',
    buildPrompt: (product, ctx) => {
      const country = ctx.selectedCountry || 'önceki bölümde belirlenen birinci öncelikli pazarda'
      return `
Sen pazar araştırma şirketlerinin (Statista, Grand View Research, Mordor Intelligence) raporlarını tarayan bir araştırma analistisin.

${buildContextBlock(ctx, ['target_countries'])}

## Bağlam
Önceki bölümde **${country}** birinci öncelikli pazar olarak seçildi. Şimdi bu pazarın derin bir büyüklük ve büyüme analizini yapmalısın.

## Görev
${country} "${product}" sektörünün pazar büyüklüğü, büyüme dinamikleri ve 2026 projeksiyonunu çıkar.

Zorunlu alanlar:
1. **Güncel pazar büyüklüğü** — son veri yılı USD (kaynak + yıl).
2. **CAGR (2022–2024)** — yıllık bileşik büyüme hızı (% kesin değer, kaynak).
3. **2026 projeksiyonu** — USD ve büyüme oranı; metodolojiyi 1 cümlede açıkla.
4. **Pazarı büyüten 3 trend** — teknolojik, demografik, yasal/düzenleyici (her biri 2 cümle).
5. **2-3 risk faktörü** — yavaşlatabilecek tehditler.
6. **Türkiye penceresi** — bu büyüme hızı Türk ihracatçısı için fırsat mı, zaman baskısı mı? Net yorum.

## Çıktı Formatı
### Pazar Büyüklüğü Özet
\`\`\`
| Yıl | Pazar Büyüklüğü (USD) | Kaynak |
| 2022 | ... | ... |
| 2024 | ... | ... |
| 2026 (tahmin) | ... | ... |
\`\`\`
**CAGR 2022–2024:** %X.X  |  **2024 → 2026 büyüme:** %X.X

### Pazarı Büyüten Trendler
1. **[Trend adı]** — 2 cümle + kaynak.
2. ...
3. ...

### Risk Faktörleri
- ...

### Türkiye İhracatçısı İçin Yorum
3-4 cümle. "Şimdi mi girmeli, beklemeli mi?" sorusuna cevap.

## Kalite Kuralları
- Her rakam için \`[Kaynak: Statista 2024 / Eurostat / vb.]\` belirt.
- Önceki bölümdeki gümrük avantajı + Türkiye payı verisini yorumla.
- Veri yoksa "veri bulunamadı, en yakın proxy: ..." de.
`.trim()
    },
  },

  {
    key: 'consumer_profile',
    title: 'Tüketici Profili',
    phase: 1,
    model: 'openai',
    buildPrompt: (product, ctx) => {
      const country = ctx.selectedCountry || 'hedef pazar'
      return `
Sen B2B ve B2C alıcı davranışını analiz eden bir tüketici içgörü uzmanısın.

${buildContextBlock(ctx, ['target_countries', 'market_size_growth'])}

## Bağlam
${country} pazarında "${product}" satın alan tipik alıcıyı iki katmanda tanımlayacaksın. Önceki bölümlerdeki pazar büyüklüğü ve büyüme verisini hangi segmentin baskın olduğunu okurken kullan.

## Görev
${country}'de "${product}" satın alan tipik alıcıyı iki ayrı katmanda tanımla.

### B2B Alıcı Profili (zorunlu alanlar)
1. **Şirket tipi** — distribütör / perakende zinciri / e-ticaret platformu / horeca / kurumsal.
2. **Karar verici unvanı** — tipik pozisyon + yaş aralığı + geçmiş.
3. **MOQ beklentisi** — tipik minimum sipariş.
4. **Tercih ettiği iletişim kanalı** — LinkedIn / e-posta / fuar / WhatsApp / telefon — sırala.
5. **Satın alma döngüsü süresi** — ilk temastan PO'ya gün sayısı.

### B2C Son Kullanıcı Profili
1. **Yaş aralığı** — birincil + ikincil segment.
2. **Gelir düzeyi** — ülke ortalamasına göre konum.
3. **Yaşam tarzı segmenti** — 2 cümlelik psikografik portre.
4. **Satın alma motivasyonları** — ilk 5 sıralı.
5. **Birincil satın alma kanalı** — fiziksel / e-ticaret / sosyal / abonelik.

### Ulaşma Stratejisi
- **Dijital kanallar** (3 madde): platform + içerik + bütçe bandı.
- **Offline kanallar** (3 madde): fuar adı + tarihi, bayi tipi, etkinlik.

## Çıktı Formatı
3 başlık (B2B / B2C / Ulaşma Stratejisi). B2B ve B2C tablo halinde:
\`\`\`
| Alan | Değer | Notlar |
\`\`\`

## Kalite Kuralları
- Genel ifade ("genç tüketiciler") yasak — somut yaş + somut gelir bandı (USD).
- Türkiye ürünü olmanın kültürel algısına 2 cümle yorum yap.
`.trim()
    },
  },

  {
    key: 'legal_customs',
    title: 'Yasal & Gümrük Çerçevesi',
    phase: 1,
    model: 'openai',
    buildPrompt: (product, ctx) => {
      const country = ctx.selectedCountry || 'hedef ülke'
      return `
Sen ihracat operasyonu danışmanısın. Türkiye Ticaret Bakanlığı mevzuatı, AB TARIC ve hedef ülke gümrük kodlarında uzmansın. Belirsizliklerde "doğrulama önerisi" verirsin.

${buildContextBlock(ctx, ['target_countries'])}

## Bağlam
Önceki bölümde ${country} seçildi ve gümrük avantajı (ATR.1 / STA / GTS) özetlendi. Şimdi tam yasal & operasyonel çerçeveyi çıkar.

## Görev
Türkiye → ${country} "${product}" ihracatı için tam yasal & gümrük çerçevesi.

Zorunlu alanlar:
1. **GTİP kodu tahmini** — 12 haneli + açıklama. Belirsizlik varsa 2 alternatif.
2. **Gümrük tarifesi** — Standart oran (MFN) + Türkiye indirimli oran + menşe belgesi.
3. **Zorunlu sertifikalar** — her biri için: ad, neyi kanıtlıyor, tahmini maliyet (EUR), süre, veren kurum.
4. **Etiketleme & ambalaj** — dil, içerik, semboller, geri dönüşüm.
5. **En sık 3 gümrük hatası** — problem + önleme.
6. **Toplam uyum maliyeti** — ilk sefer + yıllık yenileme (EUR).
7. **Toplam hazırlık süresi** — sıfırdan sertifikalı ürün hazır olana kadar (hafta).

## Çıktı Formatı
### GTİP & Tarife
\`\`\`
| Alan | Değer |
\`\`\`

### Zorunlu Sertifikalar
\`\`\`
| Sertifika | Neyi Kanıtlar | Maliyet (EUR) | Süre | Veren Kurum |
\`\`\`

### Etiketleme Kuralları
- Madde madde.

### Yaygın Hatalar
1. **Hata:** ...  →  **Önleme:** ...

### Maliyet & Zaman Özeti
- **İlk sefer toplam:** ~X.XXX EUR
- **Yıllık yenileme:** ~XXX EUR
- **Hazırlık süresi:** X hafta

## Kalite Kuralları
- Belirsiz alanda "Gümrük müşaviri ile doğrulanmalı" notu zorunlu.
- Sertifika maliyetlerinde bant ver (örn. 800-1.500 EUR).
- KOSGEB / Ticaret Bakanlığı destekleri uygunsa belirt.
`.trim()
    },
  },

  // ═══ FAZ 2: KONUMLANDIRMA & İLETİŞİM (GPT-4o) ════════════════════════
  {
    key: 'usp_positioning',
    title: 'USP & Konumlandırma',
    phase: 2,
    model: 'openai',
    buildPrompt: (product, ctx) => {
      const country = ctx.selectedCountry || 'hedef pazar'
      return `
Sen B2B konumlandırma ve marka stratejisi uzmanısın. April Dunford, Al Ries, Geoffrey Moore okulundan beslenirsin.

${buildContextBlock(ctx, ['target_countries', 'market_size_growth', 'consumer_profile', 'legal_customs'])}

## Bağlam
Faz 1 tamamlandı: ${country} pazarı seçildi, tüketici profili ve yasal çerçeve net. Şimdi pazardaki boş köşeyi bulup tek cümlede sahipleneceksin.

## Görev
"${product}" için ${country} pazarında kazandıracak USP ve konumlandırmayı oluştur.

1. **Rakip zayıf noktaları (3 madde)** — yerleşik markaların review'lerinde tekrar eden ortak şikayetler.
2. **Türkiye üretiminin somut güçleri** — el işçiliği / maliyet / hammadde / esnek MOQ / hızlı teslim — sadece geçerli olanları seç.
3. **Tek cümlelik USP** — formül: "[Hedef alıcı] için [kategori] olarak [tek belirgin fark] sunan tek/ender [coğrafya/segment] markası."
4. **3 mesaj varyantı**: Premium / Değer odaklı / Hikaye odaklı.
5. **5 kanıt noktası** — sertifika (önceki bölümden), üretim kapasitesi, müşteri referansı tipi, ödül, basın çıkışı.

## Çıktı Formatı
### Rakip Zayıflıkları
- ...

### Türkiye Üretiminin Güçleri
- ...

### USP
- **TR:** "..."
- **EN:** "..."

### Mesaj Varyantları
\`\`\`
| Ton | TR | EN |
\`\`\`

### Kanıt Noktaları
1. ...

## Kalite Kuralları
- "Yüksek kalite", "uygun fiyat" gibi klişeler yasak — her ifade ölçülebilir.
- USP cümlesi 20 kelimeyi geçmemeli.
- Tüketici profilindeki birincil segmente hitap etmeli.
- Yasal çerçevedeki sertifikaları kanıt noktası olarak kullan.
`.trim()
    },
  },

  {
    key: 'price_strategy',
    title: 'Fiyat Stratejisi',
    phase: 2,
    model: 'openai',
    buildPrompt: (product, ctx) => {
      const country = ctx.selectedCountry || 'hedef pazar'
      return `
Sen ihracat fiyatlandırma uzmanısın. FOB / CIF / DDP zincirini sayısal modelleyebilirsin.

${buildContextBlock(ctx, ['market_size_growth', 'consumer_profile', 'legal_customs', 'usp_positioning'])}

## Bağlam
${country} pazarı seçildi. Yasal çerçevede gümrük tarifesi ve KDV netleşti. USP premium/orta/ekonomik konumunu belirlemiş olmalı.

## Görev
${country} için "${product}" fiyat konumlandırma stratejisi.

1. **Pazar fiyat bantları** — ekonomik / orta / premium + her bantta 2-3 rakip marka (yerel para + EUR).
2. **Maliyet zinciri modeli** — örnek birim üzerinden:
   - FOB Türkiye (USD)
   - Deniz/kara nakliye (USD/ünite)
   - Sigorta + boşaltma → CIF
   - **Gümrük vergisi: önceki yasal bölümden al**
   - **KDV: hedef ülke oranı, yasal bölümden al**
   - Distribütör marjı (%X)
   - Perakende marjı (%X)
   - **Son tüketici fiyatı**
3. **Önerilen fiyat bandı** — USP konumuna uygun, Türkiye'den FOB hangi rakamda olmalı? Gerekçeli.
4. **Marjı korurken fiyat avantajı** — 3 somut taktik.

## Çıktı Formatı
### Pazar Fiyat Bantları
\`\`\`
| Segment | Tipik Raf Fiyatı | Örnek Markalar |
\`\`\`

### Maliyet Zinciri (Örnek Birim)
\`\`\`
| Aşama | USD/ünite | Kümülatif |
\`\`\`

### Önerilen Konum
- **Hedef segment:** ...
- **Hedef raf fiyatı:** ... EUR
- **Türkiye FOB:** ... USD
- **Gerekçe:** 3-4 cümle (USP + tüketici profili referanslı).

### Marj Koruma Taktikleri
1. ...

## Kalite Kuralları
- Tüm rakamlar bir ürün özelinde olmalı.
- Gümrük + KDV oranları önceki yasal bölümden referanslanmalı.
- Distribütör/perakende marjı sektör tipiyle uyumlu olmalı.
`.trim()
    },
  },

  {
    key: 'multilingual_content',
    title: 'Çok Dilli Ürün İçeriği',
    phase: 2,
    model: 'openai',
    buildPrompt: (product, ctx) => {
      const country = ctx.selectedCountry || 'hedef ülke'
      return `
Sen B2B ihracat pazarlama copywriter'ısın. Generic çeviri değil — native ses üretirsin.

${buildContextBlock(ctx, ['consumer_profile', 'usp_positioning'])}

## Bağlam
${country} pazarı için "${product}" pazarlama içeriği lazım. USP'yi merkeze al, tüketici profili tonunu kullan. Birincil dil: ${country}'in resmi dili. İkinci dil: İngilizce.

## Görev
"${product}" için pazara hazır pazarlama içeriği.

1. **Ürün açıklaması (150 kelime)** — fayda → özellik → kanıt, B2B tonu.
2. **5 maddelik özellik listesi** — her madde max 12 kelime, "özellik → faydası" formu.
3. **3 başlık seçeneği**:
   - E-ticaret başlığı (SEO + fayda)
   - Katalog başlığı (kısa, marka çağrışımı)
   - Fuar standı başlığı (3-5 kelimelik vurucu)

Her madde **iki dilde** (birincil + İngilizce).

## Çıktı Formatı

### Ürün Açıklaması
**[Birincil Dil]:**
[150 kelime]

**English:**
[150 word]

### Özellik Listesi
\`\`\`
| # | [Birincil Dil] | English |
\`\`\`

### Başlık Seçenekleri
\`\`\`
| Kullanım | [Birincil Dil] | English |
\`\`\`

## Kalite Kuralları
- USP cümlesi ürün açıklamasının ilk 30 kelimesinde geçmeli.
- "Quality", "Premium", "Best" gibi içi boş sıfatlar yasak.
- Hedef dilde idiomatik yaz.
- Sertifika geçerse uluslararası adıyla (ISO 22000, CE, EU Organic).
`.trim()
    },
  },

  // ═══ FAZ 3: İLK TEMAS & SATIŞ (Claude) ════════════════════════════════
  {
    key: 'buyer_list',
    title: 'Potansiyel Alıcı Listesi',
    phase: 3,
    model: 'claude',
    buildPrompt: (product, ctx) => {
      const country = ctx.selectedCountry || 'hedef pazar'
      return `
Sen ihracat lead generation uzmanısın. LinkedIn Sales Navigator, ticaret odası rehberleri ve sektör dernek dizinlerini tarayan bir araştırmacı gibi çalışırsın.

${buildContextBlock(ctx, ['consumer_profile', 'usp_positioning', 'price_strategy'])}

## Bağlam
${country} pazarına "${product}" satılacak. Tüketici profilinde B2B alıcı tipi netleşti, USP belli, fiyat segmenti seçildi. Şimdi gerçek firma/kanal türleri ile somut bir alıcı haritası çıkarmalısın.

## Görev
${country}'de "${product}" ithal eden veya distribüte edebilecek alıcıları 4 kategoride listele.

### Kategori 1: Büyük Distribütörler / İthalatçılar (3-5 firma)
- Firma adı, web sitesi, ana segment, LinkedIn pozisyon adı, ulaşma kanalı.

### Kategori 2: E-ticaret Satıcıları / Pazaryeri (3-5)
- Platform/satıcı, tipi, tedarikçi başvuru linki.

### Kategori 3: Perakende Zincirleri (3-5)
- Zincir, ilgili kategori, vendor portal, private label fırsatı.

### Kategori 4: Fuar & Ticaret Platformları (2-3)
- Fuar adı + şehir + tarih, katılımcı profili, Türk pavyonu, maliyet bandı (EUR).

### Başlangıç Önerisi
4 kategoriden hangisiyle başlanmalı? Tek paragraf — fiyat segmenti + USP konumuyla en uyumlu olan hangisi?

## Çıktı Formatı
Her kategori tablo halinde:
\`\`\`
| Firma/Platform | Web | Tipi | İletişim Yolu | Not |
\`\`\`

Sonunda **Başlangıç Önerisi** (4-5 cümle).

## Kalite Kuralları
- Uydurma firma adı yasak — bilinmiyorsa "doğrulanmadı" + genel firma tipi.
- Her firma için 1 cümle "neden uygun" gerekçe zorunlu.
- LinkedIn pozisyon adları İngilizce.
`.trim()
    },
  },

  {
    key: 'outreach_email',
    title: 'İlk Temas E-postası',
    phase: 3,
    model: 'claude',
    buildPrompt: (product, ctx) => {
      const country = ctx.selectedCountry || 'hedef ülke'
      return `
Sen B2B soğuk e-posta uzmanısın. Spam değil, ilgi çekici ve saygılı yazarsın.

${buildContextBlock(ctx, ['consumer_profile', 'usp_positioning', 'buyer_list'])}

## Bağlam
${country}'deki bir distribütör/alıcıya "${product}" için ilk temas e-postası atılacak. USP belli, hedef alıcı tipi netleşti.

## Görev
2 versiyon e-posta:
- **Versiyon A:** İngilizce, max 180 kelime.
- **Versiyon B:** ${country}'nin resmi dilinde, 60-80 kelime kısa versiyon.

Her versiyonda zorunlu yapı:
1. **Konu satırı** — 6-9 kelime, kişisel, "Re:" / "Quick question" tuzaklarına hayır.
2. **Giriş (2-3 cümle)** — alıcının pazarına özel gözlem. "Hope you are well" yasak.
3. **Önerimiz (3 madde / 30 kelime)** — USP cümlesi + Türkiye avantajı.
4. **Sosyal kanıt (1 cümle)** — sertifika / referans / ihracat hacmi.
5. **Eylem çağrısı** — düşük taahhüt: "15 dakikalık görüşme" veya "ücretsiz numune".
6. **Kapanış** — isim, unvan, şirket, LinkedIn yer tutucu.

## Çıktı Formatı

### Versiyon A — English
**Subject:** ...
[e-posta gövdesi]

### Versiyon B — ${country}
**Konu:** ...
[60-80 kelime]

### Notlar
- A/B test önerisi: 2 konu satırı 50/50, 3 gün sonra kazananı seç.
- Follow-up: 4 iş günü sonra 2 cümlelik hatırlatma.

## Kalite Kuralları
- "I hope this email finds you well" kesinlikle yasak.
- USP cümlesini önceki USP bölümünden birebir referans al.
- Hiçbir cümle dolgu olamaz.
`.trim()
    },
  },

  {
    key: 'negotiation_prep',
    title: 'Müzakere Hazırlığı',
    phase: 3,
    model: 'claude',
    buildPrompt: (product, ctx) => {
      const country = ctx.selectedCountry || 'hedef ülke'
      return `
Sen B2B ihracat müzakere koçusun. Erin Meyer "Culture Map" çerçevesine hakimsin.

${buildContextBlock(ctx, ['consumer_profile', 'price_strategy', 'legal_customs'])}

## Bağlam
${country}'li bir alıcıyla "${product}" satışı için müzakere yapılacak. Fiyat stratejisi belli, kültürel ipuçları tüketici profilinde özetlendi.

## Görev
Müzakereye girmeden önce ihracatçının elinde olması gereken her şey.

1. **Kültürel müzakere tarzı (3-5 madde)**
   ${country}: direkt/dolaylı iletişim, hiyerarşi, ilişki vs sözleşme, zaman algısı, karar hızı.

2. **En sık 5 itiraz + hazır cevap**
   - "Fiyatınız [rakip]'ten yüksek." (önceki fiyat zincirini kullan)
   - "Türkiye'den çalışmadık, lojistik riski."
   - "MOQ çok yüksek."
   - "Kalite garantiniz nedir?" (sertifikaları referansla)
   - "Ödeme şartlarınız uygun değil."
   Her itiraza 3-4 cümlelik **veri destekli** cevap.

3. **Asla verilmemesi gereken 3 konsesyon**
   - Hangi konsesyon, neden tehlikeli, alternatif teklif.

4. **Anlaşmayı hızlandıracak 3 teşvik**
   Ödeme vadesi / numune / sertifika maliyeti / exclusive territory / co-op marketing'ten 3 tane seç + gerekçe.

5. **Minimum karlı fiyatı koruma şablonu**
   Alıcı %X indirim isterse 3 farklı yanıt seviyesi (durdurma → alternatif paket → son sınır).

## Çıktı Formatı

### Müzakere Tarzı (${country})
- ...

### İtirazlar & Cevaplar
\`\`\`
| İtiraz | Hazır Cevap |
\`\`\`

### Verilmemesi Gereken Konsesyonlar
1. **Konsesyon:** ...  →  **Tehlike:** ...  →  **Alternatif:** ...

### Anlaşma Hızlandırıcılar
1. ...

### Fiyat Savunma Şablonu (İngilizce)
> "Thank you for raising that..."
[3 yanıt seviyesi]

## Kalite Kuralları
- Genel ifade ("nazik olun") yasak — somut taktik.
- Fiyat zincirinden somut rakamlar kullan.
- Konuşma şablonu doğal İngilizce — formel rapor dili değil.
`.trim()
    },
  },

  // ═══ FAZ 4: SENTEZ ════════════════════════════════════════════════════
  {
    key: 'executive_summary',
    title: 'Yönetim Özeti & Aksiyon Planı',
    phase: 4,
    model: 'openai',
    buildPrompt: (product, ctx) => {
      const country = ctx.selectedCountry || 'seçilen pazar'
      return `
Sen ihracat danışmanlığı raporlarının yönetici özetini yazan kıdemli bir analistsin. Karar verici 1 sayfada okuyup harekete geçebilmeli.

${buildContextBlock(ctx, [
  'target_countries',
  'market_size_growth',
  'consumer_profile',
  'legal_customs',
  'usp_positioning',
  'price_strategy',
  'multilingual_content',
  'buyer_list',
  'outreach_email',
  'negotiation_prep',
])}

## Bağlam
Yukarıda 10 bölümlük tam ihracat analizi var. "${product}" ürünü ${country} pazarına ihracat için tüm araştırma + strateji + satış adımları tamam.

## Görev
Tek sayfalık yönetim özeti + 8 haftalık somut aksiyon planı üret.

## Çıktı Formatı

### Yönetim Özeti
**Hedef pazar:** ${country}
**Pazar büyüklüğü:** ... USD ([yıl])
**Önerilen segment:** [USP'den]
**Beklenen ilk yıl satış potansiyeli:** ... (gerekçeli tahmin)

**Niye ${country}? (3 cümle)** ...

**Türkiye'nin avantajı (1 cümle)** ...

**3 En Büyük Risk:**
1. ...
2. ...
3. ...

### 8 Haftalık Aksiyon Planı

\`\`\`
| Hafta | Aksiyon | Sahip | Tahmini Maliyet (EUR) | Çıktı |
| 1 | GTİP başvurusu + sertifika kontağı | İhracat | ... | GTİP onayı |
| 2 | ... | ... | ... | ... |
\`\`\`

8 hafta tamamen doldurulmalı.

### İlk 30 Gün İçin Kritik Karar Noktaları
1. ...
2. ...
3. ...

### Toplam Yatırım Tahmini
- Sertifika + uyum: ~X.XXX EUR
- Pazarlama + numune: ~XXX EUR
- Fuar (isteğe bağlı): ~X.XXX EUR
- **TOPLAM (yıl 1 sıfırdan ihracat):** ~XX.XXX EUR

### Başarı Metrikleri (KPI)
- 30 gün: ... e-posta açılma, ... görüşme.
- 90 gün: ... numune talebi, ... PO görüşmesi.
- 180 gün: ilk PO.

## Kalite Kuralları
- Hiçbir rakam uydurulamaz — önceki 10 bölümden referansla.
- Her aksiyon somut + sahipli + maliyetli olmalı.
- "Geliştirilmeli", "araştırılmalı" gibi muğlak fiiller yasak.
- 1 sayfa hedefi: ekran yüksekliğinde okunabilmeli.
`.trim()
    },
  },
]

export const PHASE_META = {
  1: { title: 'Araştırma & Hazırlık', subtitle: 'Pazar verisi — Perplexity + GPT-4o' },
  2: { title: 'Konumlandırma & İletişim', subtitle: 'Strateji & içerik — GPT-4o' },
  3: { title: 'İlk Temas & Satış', subtitle: 'Alıcı & müzakere — Claude' },
  4: { title: 'Yönetim Özeti', subtitle: 'Sentez & aksiyon planı — GPT-4o' },
} as const
