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

  // Pilot mod: sadece "Pilot" rozet.
  if (!limitsActive) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15"
        title={`Bu ay kullanılan: ${usedFormatted} token (pilot — sınırsız)`}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/90">
          Pilot
        </span>
        <span className="text-[11px] text-white/60">
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

  const dotColor = isExhausted
    ? 'bg-red-400'
    : isWarning
      ? 'bg-amber-400'
      : 'bg-emerald-400'
  const barColor = isExhausted
    ? 'bg-red-400'
    : isWarning
      ? 'bg-amber-400'
      : 'bg-emerald-400'

  const limitFormatted = limit.toLocaleString('tr-TR')

  return (
    <div className="hidden sm:flex items-center gap-2">
      <div
        className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15"
        title={`${usedFormatted} / ${limitFormatted} token (${pct}%)`}
      >
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden />
        <span className="text-[11px] text-white/80">
          {isExhausted
            ? '🔥 Hakkın bitti'
            : isWarning
              ? `🔥 ~${reportsLeft} rapor hakkın kaldı`
              : `${usedFormatted} / ${limitFormatted}`}
        </span>
        <div className="w-12 h-1 rounded-full bg-white/20 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-white/60 tabular-nums">{pct}%</span>
      </div>
      {(isWarning || isExhausted) && (
        <Link
          href="/pricing"
          className={`text-[10px] font-semibold text-white px-2 py-0.5 rounded-full transition-colors ${
            isExhausted
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-amber-500 hover:bg-amber-600'
          }`}
        >
          {isExhausted ? 'Token Satın Al' : 'Az Kaldı →'}
        </Link>
      )}
    </div>
  )
}
