import { generateText } from 'ai'
import { openrouter } from '@/lib/llm'

export interface Lead {
  name: string
  description: string
  website: string
  scale: string
  source: string
}

export interface LeadFinderResult {
  leads: Lead[]
  tokensUsed: number
}

export async function findLeads(
  product: string,
  country: string,
  count = 20,
): Promise<LeadFinderResult | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('[lead-finder] OPENROUTER_API_KEY missing')
    return null
  }

  const prompt = `${country}'da "${product}" ithal eden top ${count} B2B alıcı firma listesi.

SADECE şu JSON array formatını döndür, başka hiçbir şey yazma:

[
  {
    "name": "Firma adı",
    "description": "Kısa açıklama — ne iş yapar, neden bu ürünü alır",
    "website": "https://... (bilinmiyorsa boş string)",
    "scale": "Büyük / Orta / KOBİ",
    "source": "Bu bilginin kaynağı veya bağlamı"
  }
]

Kurallar:
- Gerçek, doğrulanabilir firmalar. Uydurma.
- Her firmayı ${product} ithalatıyla ilişkilendir.
- website alanı varsa tam URL, yoksa boş string.
- description max 120 karakter.
- source: hangi sektörde, neden bu ürünü ithal edebileceğini gösteren bağlam.`

  try {
    const result = await generateText({
      model: openrouter('perplexity/sonar-pro'),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      maxOutputTokens: 2500,
    })

    const raw = result.text.trim()
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('[lead-finder] no JSON array in response:', raw.slice(0, 200))
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<Partial<Lead>>
    const leads: Lead[] = parsed
      .filter((l) => l && typeof l === 'object' && l.name)
      .slice(0, count)
      .map((l) => ({
        name: String(l.name ?? '').slice(0, 120),
        description: String(l.description ?? '').slice(0, 200),
        website: String(l.website ?? ''),
        scale: String(l.scale ?? ''),
        source: String(l.source ?? '').slice(0, 300),
      }))

    console.log('[lead-finder] found', leads.length, 'leads, tokens:', result.usage?.totalTokens ?? 0)

    return {
      leads,
      tokensUsed: result.usage?.totalTokens ?? 0,
    }
  } catch (err) {
    console.error('[lead-finder] failed:', err)
    return null
  }
}
