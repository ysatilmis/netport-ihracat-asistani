// GTİP (HS Code) statik verileri — yaygın TR ihracat GTİP'leri ve shortcut tablosu
import type { GtipShortcut } from './types';

/**
 * Türkiye'nin en yaygın ihracat GTİP kodları — kısayol tablosu.
 * Task 2 çıktısı: elle küratörlü, en sık kullanılan kodlar.
 */
export const GTIP_SHORTCUTS: GtipShortcut[] = [
  // --- TEKSTİL & HAZIR GİYİM ---
  { name: 'pamuk', code: '520100', description: 'Cotton, not carded or combed', category: 'tekstil' },
  { name: 'pamuk ipliği', code: '520500', description: 'Cotton yarn (other than sewing thread)', category: 'tekstil' },
  { name: 'tişört', code: '610910', description: 'T-shirts, singlets, of cotton', category: 'hazir-giyim' },
  { name: 'kazak', code: '611020', description: 'Pullovers, cardigans of cotton', category: 'hazir-giyim' },
  { name: 'kot pantolon', code: '620342', description: 'Jeans, men\'s trousers of cotton', category: 'hazir-giyim' },
  { name: 'kadın giyim', code: '620440', description: 'Women\'s suits, jackets, dresses', category: 'hazir-giyim' },
  { name: 'ev tekstili', code: '630210', description: 'Bed linen, of cotton', category: 'tekstil' },
  { name: 'halı', code: '570110', description: 'Carpets of wool or fine animal hair', category: 'tekstil' },
  { name: 'deri', code: '410710', description: 'Leather of bovine, full grain', category: 'deri' },
  { name: 'deri ayakkabı', code: '640399', description: 'Leather footwear, other', category: 'deri' },

  // --- GIDA & TARIM ---
  { name: 'fındık', code: '080221', description: 'Hazelnuts, in shell', category: 'gida' },
  { name: 'fındık içi', code: '080222', description: 'Hazelnuts, shelled', category: 'gida' },
  { name: 'zeytinyağı', code: '150910', description: 'Virgin olive oil', category: 'gida' },
  { name: 'zeytin', code: '200570', description: 'Olives, prepared or preserved', category: 'gida' },
  { name: 'kuru üzüm', code: '080620', description: 'Grapes, dried (raisins)', category: 'gida' },
  { name: 'kayısı', code: '080910', description: 'Apricots, fresh', category: 'gida' },
  { name: 'kuru kayısı', code: '081310', description: 'Apricots, dried', category: 'gida' },
  { name: 'incir', code: '080420', description: 'Figs, fresh or dried', category: 'gida' },
  { name: 'kiraz', code: '080920', description: 'Cherries, fresh', category: 'gida' },
  { name: 'buğday', code: '100190', description: 'Wheat and meslin, other', category: 'gida' },
  { name: 'un', code: '110100', description: 'Wheat or meslin flour', category: 'gida' },
  { name: 'bisküvi', code: '190531', description: 'Sweet biscuits', category: 'gida' },
  { name: 'makarna', code: '190219', description: 'Uncooked pasta, not stuffed', category: 'gida' },
  { name: 'domates', code: '070200', description: 'Tomatoes, fresh or chilled', category: 'gida' },
  { name: 'salçalık domates', code: '200290', description: 'Tomato paste', category: 'gida' },
  { name: 'salatalık', code: '070700', description: 'Cucumbers and gherkins', category: 'gida' },
  { name: 'biber', code: '070960', description: 'Peppers, fresh or chilled', category: 'gida' },
  { name: 'bal', code: '040900', description: 'Natural honey', category: 'gida' },
  { name: 'çay', code: '090210', description: 'Green tea, flavored', category: 'gida' },
  { name: 'tütün', code: '240120', description: 'Tobacco, partly or wholly stemmed', category: 'gida' },

  // --- MADENCİLİK & METAL ---
  { name: 'mermer', code: '680221', description: 'Marble, travertine, alabaster', category: 'maden' },
  { name: 'mermer blok', code: '251512', description: 'Marble and travertine blocks', category: 'maden' },
  { name: 'çelik', code: '720800', description: 'Flat-rolled iron/steel, hot-rolled', category: 'metal' },
  { name: 'demir çelik', code: '720890', description: 'Flat-rolled iron/steel products', category: 'metal' },
  { name: 'çelik boru', code: '730400', description: 'Iron/steel tubes and pipes', category: 'metal' },
  { name: 'alüminyum', code: '760110', description: 'Aluminum unwrought, not alloyed', category: 'metal' },
  { name: 'demir cevheri', code: '260111', description: 'Iron ores, non-agglomerated', category: 'maden' },
  { name: 'bakır', code: '740311', description: 'Copper, refined, cathodes', category: 'metal' },
  { name: 'krom', code: '261000', description: 'Chromium ores and concentrates', category: 'maden' },
  { name: 'bor', code: '252800', description: 'Borates and borax', category: 'maden' },

  // --- MAKİNE & OTOMOTİV ---
  { name: 'otomobil', code: '870323', description: 'Motor vehicles, spark ignition 1500-3000cc', category: 'otomotiv' },
  { name: 'otobüs', code: '870210', description: 'Motor vehicles for 10+ persons, diesel', category: 'otomotiv' },
  { name: 'traktör', code: '870110', description: 'Pedestrian-controlled tractors', category: 'otomotiv' },
  { name: 'makine', code: '847900', description: 'Machines/mechanical appliances, other', category: 'makine' },
  { name: 'makine parçası', code: '847490', description: 'Parts of machinery, other', category: 'makine' },
  { name: 'pompa', code: '841370', description: 'Centrifugal pumps, other', category: 'makine' },
  { name: 'kompresör', code: '841480', description: 'Air/gas compressors', category: 'makine' },
  { name: 'beyaz eşya', code: '841810', description: 'Combined fridge-freezers', category: 'makine' },
  { name: ' klima', code: '841510', description: 'Air conditioning units', category: 'makine' },
  { name: 'motor', code: '840820', description: 'Diesel engines for vehicles', category: 'otomotiv' },

  // --- KİMYASAL & PLASTİK ---
  { name: 'gübre', code: '310520', description: 'Mineral/chemical fertilizers', category: 'kimyasal' },
  { name: 'ilaç', code: '300490', description: 'Medicaments, measured doses', category: 'kimyasal' },
  { name: 'plastik', code: '390100', description: 'Polyethylene, primary forms', category: 'plastik' },
  { name: 'plastik ambalaj', code: '392300', description: 'Articles for conveyance of goods, plastic', category: 'plastik' },
  { name: 'boya', code: '320810', description: 'Paints based on polyesters', category: 'kimyasal' },
  { name: 'sabun', code: '340111', description: 'Soap for toilet use', category: 'kimyasal' },
  { name: 'parfüm', code: '330300', description: 'Perfumes and toilet waters', category: 'kimyasal' },
  { name: 'kozmetik', code: '330499', description: 'Beauty/make-up preparations', category: 'kimyasal' },
  { name: 'petrol', code: '271012', description: 'Light petroleum oils', category: 'kimyasal' },
  { name: 'tarım ilacı', code: '380891', description: 'Insecticides for agriculture', category: 'kimyasal' },

  // --- ELEKTRONİK & ELEKTRİK ---
  { name: 'kablo', code: '854449', description: 'Electric conductors, other', category: 'elektrik' },
  { name: 'trafo', code: '850421', description: 'Transformers, dielectric liquid', category: 'elektrik' },
  { name: 'pano', code: '853710', description: 'Control panels, ≤1000V', category: 'elektrik' },
  { name: 'telefon', code: '851713', description: 'Smartphones', category: 'elektronik' },
  { name: 'tv', code: '852872', description: 'Television receivers, color', category: 'elektronik' },
  { name: 'buzdolabı', code: '841810', description: 'Combined fridge-freezers', category: 'elektrik' },
  { name: 'çamaşır makinesi', code: '845011', description: 'Washing machines, automatic', category: 'elektrik' },

  // --- MOBİLYA & ORMAN ÜRÜNLERİ ---
  { name: 'mobilya', code: '940330', description: 'Wooden office furniture', category: 'mobilya' },
  { name: 'koltuk', code: '940140', description: 'Seats convertible into beds', category: 'mobilya' },
  { name: 'ahşap', code: '440710', description: 'Coniferous wood sawn', category: 'orman' },
  { name: 'kontrplak', code: '441210', description: 'Plywood of bamboo', category: 'orman' },
  { name: 'kağıt', code: '480100', description: 'Newsprint paper', category: 'orman' },
  { name: 'karton', code: '481910', description: 'Cartons, boxes of corrugated paper', category: 'orman' },

  // --- SERAMİK & CAM ---
  { name: 'cam', code: '700100', description: 'Cullet and waste glass', category: 'cam' },
  { name: 'cam eşya', code: '701090', description: 'Glass bottles, other', category: 'cam' },
  { name: 'seramik', code: '690100', description: 'Ceramic building bricks', category: 'seramik' },
  { name: 'porselen', code: '691110', description: 'Porcelain tableware', category: 'seramik' },
  { name: 'fayans', code: '690790', description: 'Ceramic wall tiles', category: 'seramik' },

  // --- MÜCEVHER ---
  { name: 'altın', code: '710811', description: 'Gold, non-monetary, unwrought', category: 'mucevher' },
  { name: 'mücevher', code: '711319', description: 'Articles of jewelry, precious metal', category: 'mucevher' },
  { name: 'elmas', code: '710231', description: 'Diamonds, unworked', category: 'mucevher' },

  // --- SAVUNMA ---
  { name: 'savunma', code: '930100', description: 'Military weapons', category: 'savunma' },
  { name: 'silah', code: '930200', description: 'Revolvers and pistols', category: 'savunma' },
];

/**
 * GTİP bölüm (section) açıklamaları — HS 2022 sınıflandırması
 */
export const GTIP_SECTIONS: Record<number, string> = {
  1: 'I: Canlı Hayvanlar ve Hayvansal Ürünler',
  2: 'II: Bitkisel Ürünler',
  3: 'III: Hayvansal ve Bitkisel Katı/Sıvı Yağlar',
  4: 'IV: Gıda Sanayii Ürünleri',
  5: 'V: Maden Ürünleri',
  6: 'VI: Kimya Sanayii Ürünleri',
  7: 'VII: Plastik ve Kauçuk',
  8: 'VIII: Ham Postlar, Deri ve Kösele',
  9: 'IX: Ağaç ve Ağaçtan Eşya',
  10: 'X: Kağıt ve Kağıt Ürünleri',
  11: 'XI: Tekstil ve Tekstil Eşyası',
  12: 'XII: Ayakkabı, Şapka, Şemsiye',
  13: 'XIII: Taş, Alçı, Çimento, Seramik, Cam',
  14: 'XIV: Kıymetli Taş/Metal, Mücevher',
  15: 'XV: Adi Metaller ve Metal Eşya',
  16: 'XVI: Makine ve Mekanik Cihazlar',
  17: 'XVII: Taşıt Araçları',
  18: 'XVIII: Optik, Tıbbi Aletler, Saat',
  19: 'XIX: Silahlar ve Mühimmat',
  20: 'XX: Çeşitli Mamul Eşya',
  21: 'XXI: Sanat Eserleri, Antikalar',
};

/**
 * Kabaca GTİP kodunun hangi bölüme ait olduğunu belirlemek için fasıl aralıkları.
 * Her bölüm: [startChapter, endChapter, sectionNumber]
 */
export const GTIP_CHAPTER_RANGES: [number, number, number][] = [
  [1, 5, 1],
  [6, 14, 2],
  [15, 15, 3],
  [16, 24, 4],
  [25, 27, 5],
  [28, 38, 6],
  [39, 40, 7],
  [41, 43, 8],
  [44, 46, 9],
  [47, 49, 10],
  [50, 63, 11],
  [64, 67, 12],
  [68, 70, 13],
  [71, 71, 14],
  [72, 83, 15],
  [84, 85, 16],
  [86, 89, 17],
  [90, 92, 18],
  [93, 93, 19],
  [94, 96, 20],
  [97, 97, 21],
];

/** Bilinen geçerli GTİP kodları (shortcut tablosundaki tüm kodlar) */
export const KNOWN_GTIP_CODES: Set<string> = new Set(
  GTIP_SHORTCUTS.map(s => s.code)
);

/**
 * GTİP kodu için fasıl numarasını çıkarır (2 hane).
 * Örn: "520100" → 52
 */
export function extractChapter(code: string): number | null {
  if (code.length < 2) return null;
  const chapter = parseInt(code.substring(0, 2), 10);
  return isNaN(chapter) ? null : chapter;
}

/**
 * GTİP kodunun hangi bölüme (section) ait olduğunu bulur.
 */
export function resolveSection(code: string): { section: number; name: string } | null {
  const chapter = extractChapter(code);
  if (chapter === null) return null;

  for (const [start, end, section] of GTIP_CHAPTER_RANGES) {
    if (chapter >= start && chapter <= end) {
      return { section, name: GTIP_SECTIONS[section] ?? `Bölüm ${section}` };
    }
  }
  return null;
}
