export type LLMModel = 'perplexity' | 'openai' | 'claude'

export interface ReportSection {
  key: string
  title: string
  phase: 1 | 2 | 3
  model: LLMModel
  buildPrompt: (product: string, country: string) => string
}

export const REPORT_SECTIONS: ReportSection[] = [
  // ─── FAZ 1: ARAŞTIRMA & HAZIRLIK (Perplexity) ────────────────────────────
  {
    key: 'market_overview',
    title: 'Hedef Pazar Analizi',
    phase: 1,
    model: 'perplexity',
    buildPrompt: (product, country) =>
      `${product} için en uygun 3-5 ihracat pazarını belirle. ` +
      `${country ? `Öncelikli hedef: ${country}.` : ''} ` +
      `Her pazar için: yıllık ithalat hacmi (USD), büyüme trendi (2022-2024), ` +
      `Türkiye'nin mevcut pazar payı, gümrük avantajı (AB Gümrük Birliği veya STA), ` +
      `lojistik mesafe değerlendirmesi. Her ülke için 1-10 puan ver ve tabloyla sun. ` +
      `Güncel kaynaklardan veri getir (TradeMap, ITC).`,
  },
  {
    key: 'competitor_analysis',
    title: 'Rakip Analizi',
    phase: 1,
    model: 'perplexity',
    buildPrompt: (product, country) => {
      const market = country || 'en büyük hedef pazarda'
      return (
        `${market} pazarında ${product} kategorisinde en güçlü 5-8 rakibi listele. ` +
        `Her rakip için: marka adı, web sitesi, fiyat aralığı (EUR/USD), hedef segment ` +
        `(premium/orta/ekonomik), en güçlü 3 özelliği, müşteri yorumlarındaki en sık şikayet. ` +
        `Tablo halinde sun. Sonunda Türkiye'den ihraç eden bir KOBİ için ` +
        `bu pazardaki en büyük rekabet boşluğunu 3 maddede özetle.`
      )
    },
  },
  {
    key: 'customer_profile',
    title: 'Müşteri Profili',
    phase: 1,
    model: 'perplexity',
    buildPrompt: (product, country) => {
      const market = country || 'hedef pazarda'
      return (
        `${market}'de ${product} satın alan ideal B2B alıcı profilini ve son kullanıcı profilini ` +
        `ayrı ayrı tanımla. B2B için: şirket tipi, karar verici pozisyonu, MOQ beklentisi, ` +
        `iletişim kanalı tercihi. Son kullanıcı için: yaş, gelir düzeyi, satın alma motivasyonları ` +
        `(ilk 5), en sık kullandıkları kanal. Dijital + offline ulaşma yollarını listele.`
      )
    },
  },
  {
    key: 'customs_gtip',
    title: 'Gümrük & GTİP',
    phase: 1,
    model: 'perplexity',
    buildPrompt: (product, country) => {
      const dest = country || 'AB pazarına'
      return (
        `Türkiye'den ${dest} ${product} ihraç etmek için: ` +
        `(1) GTİP kodu önerisi ve açıklaması, ` +
        `(2) gümrük tarifesi (ATR.1 belgesiyle AB Gümrük Birliği veya STA), ` +
        `(3) zorunlu sertifikalar (CE, organik, gıda güvenlik vb.) ve tahmini maliyetleri EUR, ` +
        `(4) etiketleme gereksinimleri, ` +
        `(5) yaygın gümrük hataları ve nasıl önlenir. TARIC veya ITC verilerine dayan.`
      )
    },
  },

  // ─── FAZ 2: KONUMLANDIRMA & İLETİŞİM (GPT-4o) ──────────────────────────
  {
    key: 'usp_positioning',
    title: 'USP & Konumlandırma',
    phase: 2,
    model: 'openai',
    buildPrompt: (product, country) => {
      const market = country || 'hedef ihracat pazarında'
      return (
        `${product} ürünüm için ${market} rekabetçi bir USP oluştur. ` +
        `(1) Pazardaki rakiplerin ortak zayıf noktaları (3 madde), ` +
        `(2) Türkiye üretiminin güçlü yönleri (el işçiliği, maliyet, kalite), ` +
        `(3) Tek cümlelik USP, ` +
        `(4) 3 farklı mesaj varyantı (premium / değer / hikaye), ` +
        `(5) USP'yi destekleyen 5 kanıt noktası. Türkçe ve İngilizce ver.`
      )
    },
  },
  {
    key: 'price_strategy',
    title: 'Fiyat Stratejisi',
    phase: 2,
    model: 'openai',
    buildPrompt: (product, country) => {
      const market = country || 'hedef pazarda'
      return (
        `${market} için ${product} fiyat konumlandırma stratejisi: ` +
        `(1) Pazar fiyat bantları (ekonomik/orta/premium) ve rakip markalara örnekler, ` +
        `(2) FOB, CIF ve son tüketici fiyatı hesaplama mantığı (örnek rakamlarla EUR), ` +
        `(3) Önerilen fiyat bandı ve gerekçesi, ` +
        `(4) Marjı korurken fiyat avantajı sağlamak için 3 öneri. ` +
        `Gümrük vergileri ve lojistik maliyetleri dahil et.`
      )
    },
  },
  {
    key: 'multilingual_content',
    title: 'Çok Dilli Ürün İçeriği',
    phase: 2,
    model: 'openai',
    buildPrompt: (product, country) => {
      const lang = country ? `${country} için uygun dilde` : 'İngilizce ve Almanca'
      return (
        `${product} için ${lang} pazarlama içeriği: ` +
        `(1) 150 kelimelik ürün açıklaması, ` +
        `(2) 5 maddelik özellikler listesi, ` +
        `(3) 3 başlık seçeneği (e-ticaret / katalog / fuar için). ` +
        `Ayrıca İngilizce versiyonu da ekle. Ton: profesyonel B2B, fayda odaklı.`
      )
    },
  },

  // ─── FAZ 3: İLK TEMAS & SATIŞ (Claude) ─────────────────────────────────
  {
    key: 'buyer_list',
    title: 'Potansiyel Alıcı Listesi',
    phase: 3,
    model: 'claude',
    buildPrompt: (product, country) => {
      const market = country || 'hedef pazarda'
      return (
        `${market}'de ${product} ithal eden veya satabilecek alıcıları kategorize et: ` +
        `(1) Büyük distribütörler (3-5 firma, web sitesi ile), ` +
        `(2) E-ticaret satıcıları/platformları (3-5), ` +
        `(3) Perakende zincirleri (ilgili kategori bölümü olan 3-5), ` +
        `(4) Sektör fuarları ve ticaret platformları (en önemli 2-3). ` +
        `LinkedIn veya web üzerinden nasıl ulaşılacağını belirt. ` +
        `Hangi alıcı tipiyle başlamak en kolay ve neden?`
      )
    },
  },
  {
    key: 'outreach_email',
    title: 'İlk Temas E-postası',
    phase: 3,
    model: 'claude',
    buildPrompt: (product, country) => {
      const dest = country || 'hedef ülke'
      return (
        `${dest}'deki potansiyel bir distribütör/alıcıya ${product} için ilk temas e-postası yaz: ` +
        `(1) Dikkat çekici konu satırı, ` +
        `(2) 3-4 cümlelik giriş (alıcının pazarına özel gözlemle), ` +
        `(3) Ürün ve firmayı 3 maddede tanıt (USP öne çıkar), ` +
        `(4) Somut eylem çağrısı (zoom görüşme / numune talebi), ` +
        `(5) Kapanış. Maksimum 200 kelime, İngilizce. ` +
        `Alternatif olarak ${dest} dilinde kısa bir versiyon da ekle.`
      )
    },
  },
  {
    key: 'negotiation_prep',
    title: 'Müzakere Hazırlığı',
    phase: 3,
    model: 'claude',
    buildPrompt: (product, country) => {
      const dest = country || 'hedef ülke'
      return (
        `${dest}'li bir alıcıyla ${product} satışı için müzakere hazırlığı: ` +
        `(1) Bu kültürdeki müzakere tarzı ve dikkat edilmesi gerekenler (3-5 madde), ` +
        `(2) En sık gelen 5 itiraz ve her birine hazır cevap, ` +
        `(3) Vermemem gereken 3 konsesyon ve neden, ` +
        `(4) Anlaşmayı hızlandıracak 3 teşvik seçeneği (ödeme vadesi, numune, sertifika), ` +
        `(5) Minimum karlı fiyatı korumak için konuşma şablonu. Pratik ve sahaya dönük yaz.`
      )
    },
  },
]

export const PHASE_META = {
  1: { title: 'Araştırma & Hazırlık', subtitle: 'Canlı pazar verisi — Perplexity AI' },
  2: { title: 'Konumlandırma & İletişim', subtitle: 'Strateji & içerik — GPT-4o' },
  3: { title: 'İlk Temas & Satış', subtitle: 'Alıcı ulaşımı — Claude' },
} as const
