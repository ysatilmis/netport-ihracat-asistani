'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface AppMobileNavProps {
  signalCount?: number
}

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/results', label: 'Raporlarım' },
  { href: '/pricing', label: 'Fiyatlandırma' },
]

export default function AppMobileNav({ signalCount = 0 }: AppMobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {open ? (
            <>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute top-full right-4 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 lg:hidden">
            {LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
              const showBadge = link.href === '/results' && signalCount > 0

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mx-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span>{link.label}</span>
                  {showBadge && (
                    <span
                      className="inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                      aria-label={`${signalCount} acik pazar sinyali`}
                      title={`${signalCount} acik pazar sinyali`}
                    >
                      {signalCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </>
      )}
    </div>
  )
}
