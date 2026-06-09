import Link from 'next/link'
import { getCredits } from '@/lib/token'

interface TokenMeterProps {
  userId: string
}

export async function TokenMeter({ userId }: TokenMeterProps) {
  let credits = 0
  let plan = 'free'
  let error = false

  try {
    const balance = await getCredits(userId)
    credits = balance.credits
    plan = balance.plan
  } catch {
    error = true
  }

  const limitsActive = process.env.ENFORCE_TOKEN_LIMITS === 'true'

  if (error) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-gradient-to-br from-slate-100 to-slate-50 border-slate-200">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden />
        <span className="text-[11px] text-slate-500 font-mono">0 kredi · Free</span>
      </div>
    )
  }

  if (!limitsActive) {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 border-emerald-400/40 backdrop-blur-sm"
        title="Pilot mod — sınırsız"
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Pilot</span>
        <span className="text-[11px] text-emerald-700/70 font-mono">· {credits} kredi</span>
      </div>
    )
  }

  const isExhausted = credits <= 0
  const isWarning = credits === 1

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
  const textColor = isExhausted ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'

  const planLabel = plan === 'starter' ? 'Starter' : plan === 'pro' ? 'Pro' : 'Free'

  const pill = (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-sm ${pillClass}`}
      title={`${credits} kredi kaldı`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor} ${dotGlow}`} aria-hidden />
      <span className={`text-[11px] font-medium ${textColor}`}>
        {isExhausted ? 'Kredi bitti' : `${credits} kredi`}
      </span>
      <span className="text-[10px] text-slate-500 tabular-nums font-mono">{planLabel}</span>
    </div>
  )

  const cta = (isWarning || isExhausted) ? (
    <Link
      href="/pricing"
      className={`text-[10px] font-semibold text-white px-2.5 py-1 rounded-full transition-all hover:scale-105 ${
        isExhausted
          ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-[0_2px_8px_rgba(239,68,68,0.4)]'
          : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-[0_2px_8px_rgba(245,158,11,0.4)]'
      }`}
    >
      {isExhausted ? 'Kredi Al' : 'Son Kredi →'}
    </Link>
  ) : null

  return (
    <>
      <div className="hidden sm:flex items-center gap-2">
        {pill}
        {cta}
      </div>
      <div className="sm:hidden flex items-center">
        {pill}
      </div>
    </>
  )
}
