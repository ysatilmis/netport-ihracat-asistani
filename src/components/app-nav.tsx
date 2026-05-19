'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AppNavProps {
  signalCount?: number
}

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/results', label: 'Raporlarım' },
  { href: '/pricing', label: 'Fiyatlandırma' },
]

export function AppNav({ signalCount = 0 }: AppNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 text-sm">
      {LINKS.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`)
        const showBadge = link.href === '/results' && signalCount > 0
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors inline-flex items-center gap-1.5 ${
              isActive
                ? 'bg-white/15 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {link.label}
            {showBadge && (
              <span
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none"
                aria-label={`${signalCount} açık pazar sinyali`}
                title={`${signalCount} açık pazar sinyali`}
              >
                {signalCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
