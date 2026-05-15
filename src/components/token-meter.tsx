import { getMonthlyUsage, calculateRemainingTokens } from '@/lib/token'

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
    // subscription not found yet
  }

  const remaining = calculateRemainingTokens(used, limit)
  const percentage = Math.min(100, Math.round((used / limit) * 100))
  const isLow = percentage >= 80

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden bg-white/20">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: isLow ? '#ef4444' : '#60a5fa',
          }}
        />
      </div>
      <span className={`text-xs font-medium ${isLow ? 'text-red-300' : 'text-blue-200'}`}>
        {used.toLocaleString('tr-TR')} / {limit.toLocaleString('tr-TR')}
        {remaining === 0 && ' · Limit doldu'}
      </span>
    </div>
  )
}
