import { generateText } from 'ai'
import { openrouter } from '@/lib/llm'

export type FlagType =
  | 'kanitsiz_iddia'
  | 'celiski'
  | 'belirsiz_veri'
  | 'eksik_kaynak'
  | 'eski_veri'
  | 'jenerik_dolgu'

export interface QualityFlag {
  section: string
  type: FlagType
  severity: 1 | 2 | 3 | 4 | 5
  excerpt: string
  reason: string
  suggestion?: string
}

export interface QualityCheckResult {
  overallScore: number
  summary: string
  flags: QualityFlag[]
  tokensUsed: number
}

const SYSTEM_PROMPT = `Sen B2B ihracat raporlarını denetleyen titiz bir kalite kontrol uzmanısın. Görevin: rapor bölümlerini okuyup zayıf noktaları işaretlemek.

ARAYACAĞIN PROBLEMLER:
1. **kanitsiz_iddia** — Sayı veya kaynak olmadan ileri sürülen iddia ("kaliteli", "en iyi", "lider tedarikçi" gibi).
2. **celiski** — Aynı raporda iki bölümün birbiriyle çelişen bilgi vermesi.
3. **belirsiz_veri** — Aralık değil yuvarlak tahmin, "yaklaşık", "bandında" gibi ifadelerin kaynak olmadan sıkça geçmesi.
4. **eksik_kaynak** — Sayı verilmiş ama kaynak referansı yok ("EİB verisi 2024" gibi ek bilgi yok).
5. **eski_veri** — 2 yıldan eski veriye dayalı önemli bir iddia, güncellenme ihtiyacı.
6. **jenerik_dolgu** — Pazara özgü olmayan, herhangi bir ürün-ülke için yazılabilecek genel cümleler.

ÇIKTI FORMATI — SADECE şu JSON, başka HİÇBİR şey yazma:

{
  "overall_score": <0-10 arası ondalıklı sayı>,
  "summary": "<bir cümle Türkçe genel değerlendirme>",
  "flags": [
    {
      "section": "<bölüm key'i>",
      "type": "<yukarıdaki 6 tipten biri>",
      "severity": <1-5>,
      "excerpt": "<problemli cümlenin alıntısı, max 200 karakter>",
      "reason": "<neden flag, 1-2 cümle>",
      "suggestion": "<nasıl iyileştirilir, opsiyonel 1 cümle>"
    }
  ]
}

KURALLAR:
- Skorlama: 0-3 zayıf, 4-6 orta, 7-8 iyi, 9-10 çok iyi. Çoğu rapor 6-8 arasında olur.
- Her bölümden max 2-3 flag. Toplam max 12 flag.
- Önemsiz şey için flag açma. Sadece okuyucuya pratik değer katacak işaretler.
- Çok iyi raporlarda flags=[] olabilir. Bu durumda overall_score 8.5+ olmalı.`

interface ReportSectionInput {
  key: string
  title: string
  text: string
}

interface ChunkResult {
  overallScore: number
  summary: string
  flags: QualityFlag[]
  tokensUsed: number
  sectionCount: number
}

const CHUNK_SIZE = 4

// Trade-off: chunk'lar arası `celiski` (cross-section contradiction) tespiti
// kaybedilir — model sadece kendi chunk'ındaki bölümleri görür. Tek chunk
// içindeki çelişkiler hala yakalanır. Vercel Hobby tier 60s timeout'ı
// aşmamak için paralelleştirme zorunlu; tam coverage için Pro upgrade gerek.
async function runChunk(
  product: string,
  country: string,
  chunk: ReportSectionInput[],
): Promise<ChunkResult | null> {
  const sectionsBlock = chunk
    .map((s) => {
      const truncated =
        s.text.length > 1600
          ? s.text.slice(0, 1200) + '\n[...kısaltıldı...]\n' + s.text.slice(-400)
          : s.text
      return `### key=${s.key} · title=${s.title}\n${truncated}`
    })
    .join('\n\n---\n\n')

  const userPrompt = `Rapor: **${product} → ${country}**

Aşağıdaki ${chunk.length} bölümü denetle:

${sectionsBlock}

SADECE JSON döndür.`

  try {
    const result = await generateText({
      model: openrouter('anthropic/claude-haiku-4-5'),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
    })

    const raw = result.text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[quality-check] chunk: no JSON in response:', raw.slice(0, 200))
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<{
      overall_score: number
      summary: string
      flags: Array<Partial<QualityFlag>>
    }>

    const overallScore = Math.max(0, Math.min(10, Number(parsed.overall_score) || 0))
    const flags: QualityFlag[] = (parsed.flags ?? [])
      .filter((f) => f && typeof f === 'object' && f.section && f.type)
      .map((f) => ({
        section: String(f.section),
        type: (f.type as FlagType) ?? 'kanitsiz_iddia',
        severity: Math.max(1, Math.min(5, Number(f.severity) || 2)) as 1 | 2 | 3 | 4 | 5,
        excerpt: String(f.excerpt ?? '').slice(0, 240),
        reason: String(f.reason ?? ''),
        suggestion: f.suggestion ? String(f.suggestion) : undefined,
      }))

    return {
      overallScore,
      summary: String(parsed.summary ?? '').slice(0, 280),
      flags,
      tokensUsed: result.usage?.totalTokens ?? 0,
      sectionCount: chunk.length,
    }
  } catch (err) {
    console.error('[quality-check] chunk failed:', err)
    return null
  }
}

export async function runQualityCheck(
  product: string,
  country: string,
  sections: ReportSectionInput[],
): Promise<QualityCheckResult | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('[quality-check] OPENROUTER_API_KEY missing')
    return null
  }

  const chunks: ReportSectionInput[][] = []
  for (let i = 0; i < sections.length; i += CHUNK_SIZE) {
    chunks.push(sections.slice(i, i + CHUNK_SIZE))
  }

  const chunkResults = await Promise.all(chunks.map((c) => runChunk(product, country, c)))
  const successes = chunkResults.filter((r): r is ChunkResult => r !== null)

  if (successes.length === 0) {
    console.error('[quality-check] all chunks failed')
    return null
  }

  const totalSections = successes.reduce((sum, r) => sum + r.sectionCount, 0)
  const weightedScore =
    successes.reduce((sum, r) => sum + r.overallScore * r.sectionCount, 0) / totalSections
  const overallScore = Math.max(0, Math.min(10, weightedScore))

  const mergedFlags = successes
    .flatMap((r) => r.flags)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 12)

  const summary = successes
    .map((r) => r.summary)
    .filter(Boolean)
    .join('; ')
    .slice(0, 280)

  const tokensUsed = successes.reduce((sum, r) => sum + r.tokensUsed, 0)

  return {
    overallScore,
    summary,
    flags: mergedFlags,
    tokensUsed,
  }
}
