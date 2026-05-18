import { getMonthlyUsage } from '@/lib/token'

interface TokenMeterProps {
  userId: string
}

export async function TokenMeter({ userId }: TokenMeterProps) {
  let used = 0
  try {
    const usage = await getMonthlyUsage(userId)
    used = usage.used
  } catch {
    // subscription not found yet
  }

  // Pilot aşamasında limit pratikte sınırsız (10M default). UI sadece "Pilot"
  // rozeti gösterir, sayaç sadece tooltip'te. Ticari lansmanla detay UI geri gelir.
  const usedFormatted = used.toLocaleString('tr-TR')

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
