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
