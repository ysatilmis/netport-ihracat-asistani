import { getMonthlyUsage, calculateRemainingTokens } from '@/lib/token'
import { Progress } from '@/components/ui/progress'

interface TokenMeterProps {
  userId: string
}

export async function TokenMeter({ userId }: TokenMeterProps) {
  let used = 0
  let limit = 5000

  try {
    const usage = await getMonthlyUsage(userId)
    used = usage.used
    limit = usage.limit
  } catch {
    // Subscription not found yet — show 0
  }

  const remaining = calculateRemainingTokens(used, limit)
  const percentage = Math.min(100, Math.round((used / limit) * 100))

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span>Token:</span>
      <Progress value={percentage} className="w-20 h-2" />
      <span>{used.toLocaleString()} / {limit.toLocaleString()}</span>
      {remaining === 0 && (
        <span className="text-red-500 font-medium">Limit doldu</span>
      )}
    </div>
  )
}
