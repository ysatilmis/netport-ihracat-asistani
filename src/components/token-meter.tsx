import Link from 'next/link'
import { getMonthlyUsage } from '@/lib/token'
import { ESTIMATED_TOKENS_PER_REPORT } from '@/lib/stripe'

interface TokenMeterProps {
  userId: string
}

export async function TokenMeter({ userId }: TokenMeterProps) {
  let used = 0
  let limit = 0
  try {
    const usage = await getMonthlyUsage(userId)
    used = usage.used
    limit = usage.limit
  } catch {
    // subscription not found yet
  }

  const usedFormatted = used.toLocaleString('tr-TR')
  const limitsActive = process.env.NEXT_PUBLIC_ENFORCE_TOKEN_LIMITS === 'true'

  // Pilot mod: sadece "Pilot" rozet — V3 pastel emerald gradient
  if (!limitsActive) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 border-emerald-400/40 backdrop-blur-sm"
        title={`Bu ay kullanılan: ${usedFormatted} token (pilot — sınırsız)`}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
          Pilot
        </span>
        <span className="text-[11px] text-emerald-100/70 font-mono">
          · {usedFormatted}
        </span>
      </div>
    )
  }

  // Aktif limit modu: progress bar + yüzde + uyarı.
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const isWarning = pct >= 80 && pct < 100
  const isExhausted = pct >= 100
  const remaining = Math.max(0, limit - used)
  const reportsLeft = Math.max(0, Math.floor(remaining / ESTIMATED_TOKENS_PER_REPORT))

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

  const limitFormatted = limit.toLocaleString('tr-TR')

  return (
    <div className="hidden sm:flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-sm ${pillClass}`}
        title={`${usedFormatted} / ${limitFormatted} token (${pct}%)`}
      >
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor} ${dotGlow}`} aria-hidden />
        <span className={`text-[11px] font-medium ${textColor}`}>
          {isExhausted
            ? '🔥 Hakkın bitti'
            : isWarning
              ? `🔥 ~${reportsLeft} rapor hakkın kaldı`
              : `${usedFormatted} / ${limitFormatted}`}
        </span>
        <div className="w-12 h-1 rounded-full bg-white/15 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-white/60 tabular-nums font-mono">{pct}%</span>
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
          {isExhausted ? 'Token Satın Al' : 'Az Kaldı →'}
        </Link>
      )}
    </div>
  )
}
