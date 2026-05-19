import { generateText } from 'ai'
import { openrouter } from '@/lib/llm'
import type { CountryOption } from '@/lib/report-prompts'

const SYSTEM_PROMPT = `Sen JSON çıkarıcı bir asistansın. Verilen Türkçe ihracat-pazar analizi metninden 3 hedef ülkeyi çıkarırsın.

Sadece şu şemaya uyan SAF JSON döndür — markdown code fence yok, açıklama yok, başka metin yok:

{"countries":[{"name":"<TR ülke adı>","score":<1-10 arası tam sayı>,"customs_advantage":"<gümrük avantajı, max 80 karakter>","summary":"<o ülke için 1 cümle özet, max 140 karakter>"}]}

Kurallar:
- Tam 3 ülke döndür.
- Skor metinde belirtilmemişse pazar büyüklüğü/uygunluk sinyallerine göre 6-9 arası makul tahmin koy.
- Türkçe ülke adı kullan (USA değil "ABD", Germany değil "Almanya").
- customs_advantage boşsa "Belirsiz" yaz, asla null/undefined gönderme.`

export async function extractCountriesWithClaude(
  text: string,
): Promise<CountryOption[] | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('[extractCountriesWithClaude] OPENROUTER_API_KEY eksik')
    return null
  }

  try {
    const result = await generateText({
      model: openrouter('anthropic/claude-sonnet-4-6'),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0,
    })

    console.log(
      '[extractCountriesWithClaude] finish',
      result.text.length,
      'chars',
      result.usage?.totalTokens ?? 0,
      'tokens',
    )

    const raw = result.text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[extractCountriesWithClaude] JSON bulunamadi:', raw.slice(0, 200))
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as { countries?: unknown }
    if (!Array.isArray(parsed.countries) || parsed.countries.length === 0) {
      console.error('[extractCountriesWithClaude] countries array gecersiz')
      return null
    }

    const countries: CountryOption[] = parsed.countries
      .filter(
        (c): c is { name: string; score?: unknown; customs_advantage?: unknown; summary?: unknown } =>
          !!c && typeof c === 'object' && typeof (c as { name?: unknown }).name === 'string' && (c as { name: string }).name.trim().length > 0,
      )
      .map((c) => ({
        name: String(c.name).trim(),
        score: typeof c.score === 'number' ? c.score : Number(c.score) || 7,
        customs_advantage:
          typeof c.customs_advantage === 'string' && c.customs_advantage.trim().length > 0
            ? c.customs_advantage.trim()
            : 'Belirsiz',
        summary: typeof c.summary === 'string' ? c.summary.trim() : '',
      }))

    if (countries.length === 0) return null
    return countries
  } catch (err) {
    console.error('[extractCountriesWithClaude] hata:', err)
    return null
  }
}
