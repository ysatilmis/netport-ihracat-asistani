import { generateText } from 'ai'
import { openrouter } from '@/lib/llm'

export interface MarketSignalResult {
  hasChange: boolean
  signalType: string
  severity: 1 | 2 | 3 | 4 | 5
  summary: string
  detail: string
  currentSnapshot: string
}

const SYSTEM_PROMPT = `Sen ihracat pazar analistisin. Görev: bir ürün-ülke kombinasyonu için son 7 günde gözlemlenen ÖNEMLİ değişiklikleri tespit etmek.

Değişim sayılan tipler:
- Yeni gümrük tarifesi / tarife değişikliği
- Yeni gıda güvenliği / pestisit / aflatoksin regülasyonu
- Pazar payı verisinde belirgin değişim (Türkiye payı %5+ değişim)
- Yeni STA / GTS programı veya kapsam değişikliği
- Önemli rakip ülke davranışı (örn. ihracat yasağı, kota)
- Lojistik / navlun yapısında belirgin değişim (rota, transit süre, fiyat)

Değişim sayılmaz: genel ekonomi yorumu, opinion, eski tekrar bilgi.

ÇIKTI FORMATI — sadece şu JSON, hiç açıklama:

{
  "has_change": <true|false>,
  "signal_type": "<tarife|regulasyon|pazar_payi|sta|rakip|lojistik|none>",
  "severity": <1-5>,
  "summary": "<140 karaktere kadar Türkçe özet>",
  "detail": "<2-4 cümle gerekçe + kaynak referansı>",
  "current_snapshot": "<bu tarama için spec'lerin tek paragraf özeti — bir sonraki haftada diff için referans olur>"
}

has_change=false ise severity=1, detail boş, signal_type="none" olsun.`

const PROMPT_BUILDER = (product: string, country: string, prevSnapshot: string) => `
## Görev
"${product}" ürününün ${country} pazarındaki son 7 gündeki değişiklikleri ara.

## Önceki Snapshot (referans)
${prevSnapshot || '(ilk tarama)'}

## Spot Kontrol Soruları (her birini Perplexity ile ara)
1. ${country} ${product} ithalat tarifesi son 6 ayda değişti mi? ATR.1 / EUR.1 / STA durumu güncel mi?
2. ${country} ${product} kategorisinde yeni regülasyon (pestisit, aflatoksin, ambalaj, etiket) çıktı mı?
3. ${product} için ${country} pazar payında belirgin değişim (Türkiye dahil ilk 5 tedarikçi) var mı?
4. ${country} için ${product} sınır geçişlerinde yeni red/iade vakası, lojistik bozulması var mı?
5. ${country} ana rakip tedarikçilerinde davranış değişikliği (yasak, kota, fiyat) var mı?

## Kurallar
- Sadece somut, kaynaklı bilgi. "Görünüyor", "muhtemel" → has_change=false.
- Eski/genel bilgi tekrarı → has_change=false.
- Eğer önceki snapshot yoksa: bu tarama bir baseline. has_change=false ama current_snapshot DOLU olsun.
- JSON dışında HİÇBİR şey yazma.`.trim()

export async function checkMarketSignal(
  product: string,
  country: string,
  previousSnapshot: string,
): Promise<MarketSignalResult | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('[market-signal] OPENROUTER_API_KEY missing')
    return null
  }

  try {
    const result = await generateText({
      model: openrouter('perplexity/sonar-pro'),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: PROMPT_BUILDER(product, country, previousSnapshot) },
      ],
      temperature: 0,
      maxOutputTokens: 2000,
    })

    const raw = result.text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[market-signal] no JSON in response:', raw.slice(0, 200))
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<{
      has_change: boolean
      signal_type: string
      severity: number
      summary: string
      detail: string
      current_snapshot: string
    }>

    const sev = Math.max(1, Math.min(5, Number(parsed.severity) || 2)) as 1 | 2 | 3 | 4 | 5

    return {
      hasChange: Boolean(parsed.has_change),
      signalType: String(parsed.signal_type ?? 'none'),
      severity: sev,
      summary: String(parsed.summary ?? '').slice(0, 200),
      detail: String(parsed.detail ?? ''),
      currentSnapshot: String(parsed.current_snapshot ?? '').slice(0, 4000),
    }
  } catch (err) {
    console.error('[market-signal] error:', err)
    return null
  }
}
