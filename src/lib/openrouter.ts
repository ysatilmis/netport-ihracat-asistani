export interface OpenRouterCredits {
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  remainingPercent: number
  warningLevel: 'ok' | 'warning' | 'critical'
}

const WARNING_THRESHOLD = 0.20  // %20 kaldığında warning
const CRITICAL_THRESHOLD = 0.10 // %10 kaldığında critical

export async function getOpenRouterCredits(): Promise<OpenRouterCredits | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 300 }, // 5 dakika cache
    })

    if (!res.ok) return null

    const json = await res.json() as {
      data?: {
        limit?: number | null
        usage?: number
        label?: string
        is_free_tier?: boolean
      }
    }

    const d = json.data
    if (!d) return null

    const totalCredits = d.limit ?? 0
    const usedCredits = d.usage ?? 0
    const remainingCredits = Math.max(0, totalCredits - usedCredits)
    const remainingPercent = totalCredits > 0 ? remainingCredits / totalCredits : 0

    let warningLevel: OpenRouterCredits['warningLevel'] = 'ok'
    if (remainingPercent <= CRITICAL_THRESHOLD) warningLevel = 'critical'
    else if (remainingPercent <= WARNING_THRESHOLD) warningLevel = 'warning'

    return { totalCredits, usedCredits, remainingCredits, remainingPercent, warningLevel }
  } catch (err) {
    console.error('[openrouter] credits fetch failed:', err)
    return null
  }
}
