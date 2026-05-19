import Link from 'next/link'
import { getMonthlyUsage } from '@/lib/token'

interface TokenMeterProps {
  userId: string
}

/**
 * Navbar meter — kullanıcının aylık rapor kontenjanını gösterir.
 * (2026-05-19'da token sayısı yerine rapor sayısı gösterimi.)
 *
 * Pilot mod (ENFORCE_TOKEN_LIMITS=false): "Pilot · X rapor" — sınırsız
 * Active mod: "X / Y rapor" — Y dolarsa kırmızı "Ek Rapor Al" CTA
 */
export async function TokenMeter({ userId }: TokenMeterProps) {
  let used = 0
  let limit = 0
  let plan: 'free' | 'starter' | 'pro' = 'free'
  try {
    const usage = await getMonthlyUsage(userId)
    used = usage.used
    limit = usage.limit
    plan = usage.plan
  } catch {
    // subscription not found yet
  }

  const limitsActive = process.env.NEXT_PUBLIC_ENFORCE_TOKEN_LIMITS === 'true'
  const isUnlimited = limit < 0

  // Pilot mod: pastel gradient pill — "Pilot · X rapor"
  if (!limitsActive) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 border-emerald-400/40 backdrop-blur-sm"
        title={`Bu ay ${used} rapor üretildi (pilot — sınırsız)`}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">Pilot</span>
        <span className="text-[11px] text-emerald-100/70 font-mono">· {used} rapor</span>
      </div>
    )
  }

  // Pro tier (sınırsız) — yeşil pill, "Sınırsız" yazısı
  if (isUnlimited) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 border-emerald-400/40 backdrop-blur-sm"
        title={`Pro plan — sınırsız rapor`}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">Pro</span>
        <span className="text-[11px] text-emerald-100/80 font-mono">· Sınırsız</span>
      </div>
    )
  }

  // Aktif limit modu (free/starter/free+pack): X / Y rapor + remaining
  const remaining = Math.max(0, limit - used)
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const isWarning = remaining > 0 && remaining <= 1 // 1 rapor veya altı → uyarı
  const isExhausted = remaining === 0

  const pillClass = isExhausted
    ? 'bg-gradient-to-br from-red-500/25 to-red-400/15 border-red-400/50'
    : isWarning
      ? 'bg-gradient-to-br from-amber-500/25 to-amber-400/15 border-amber-400/50'
      : 'bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 border-emerald-400/40'
  const dotColor = isExhausted ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
  const dotGlow = isExhausted
    ? 'shadow-[0_0_4px_rgba(248,113,113,0.6)]'
    : isWarning
      ? 'shadow-[0_0_4px_rgba(251,191,36,0.6)]'
      : 'shadow-[0_0_4px_rgba(52,211,153,0.6)]'
  const barColor = isExhausted ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
  const textColor = isExhausted ? 'text-red-100' : isWarning ? 'text-amber-100' : 'text-emerald-100/90'

  return (
    <div className="hidden sm:flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-sm ${pillClass}`}
        title={`${used} / ${limit} rapor (${pct}%) · ${remaining} hakkın kaldı`}
      >
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor} ${dotGlow}`} aria-hidden />
        <span className={`text-[11px] font-medium ${textColor}`}>
          {isExhausted
            ? '🔥 Hakkın bitti'
            : isWarning
              ? `🔥 ${remaining} rapor hakkın kaldı`
              : `${used} / ${limit} rapor`}
        </span>
        <div className="w-12 h-1 rounded-full bg-white/15 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-white/60 tabular-nums font-mono">{plan === 'free' ? 'Free' : plan === 'starter' ? 'Starter' : 'Pro'}</span>
      </div>
      {(isWarning || isExhausted) && (
        <Link
          href="/pricing"
          className={`text-[10px] font-semibold text-white px-2.5 py-1 rounded-full transition-all hover:scale-105 ${
            isExhausted
              ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-[0_2px_8px_rgba(239,68,68,0.4)]'
              : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-[0_2px_8px_rgba(245,158,11,0.4)]'
          }`}
        >
          {isExhausted ? 'Ek Rapor Al' : 'Az Kaldı →'}
        </Link>
      )}
    </div>
  )
}
