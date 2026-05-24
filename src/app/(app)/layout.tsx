import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/actions/auth'
import Link from 'next/link'
import Image from 'next/image'
import { TokenMeter } from '@/components/token-meter'
import { AppNav } from '@/components/app-nav'
import { getUnresolvedSignalCount } from '@/actions/signals'
import AppMobileNav from '@/components/app-mobile-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const signalCount = await getUnresolvedSignalCount().catch(() => 0)

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-20 px-4 sm:px-6">
          <div className="flex items-center gap-3 md:gap-6">
            <Link
              href="/dashboard"
              className="group flex items-center transition-transform hover:scale-[1.02]"
              aria-label="Netport ana sayfa"
            >
              <Image
                src="/netport-logo.png"
                alt="Netport"
                width={400}
                height={400}
                unoptimized
                priority
                className="h-12 md:h-16 w-auto object-contain"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-strong)] text-white shadow-sm">
              AI
            </span>
            <div className="hidden lg:block">
              <AppNav signalCount={signalCount} />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <TokenMeter userId={user.id} />
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:shadow-sm active:scale-95 px-3 py-2 rounded-lg"
              >
                Çıkış
              </button>
            </form>
            <div className="lg:hidden">
              <AppMobileNav signalCount={signalCount} />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6 w-full flex flex-col items-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Sol sütun — İletişim */}
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Netport Global A.Ş.
              </h3>
              <address className="not-italic text-sm leading-relaxed space-y-2">
                <p>
                  Gülbahçe Mah. Gülbahçe Cad.
                  <br />
                  İYTE Sit. TEKNOPARK İZMİR A1 Binası
                  <br />
                  Apt. No:1/17/48 URLA İZMİR
                </p>
                <p>
                  Tel:{' '}
                  <a
                    href="tel:+902324837934"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    +90.232.483 79 34
                  </a>
                </p>
                <p>
                  Email:{' '}
                  <a
                    href="mailto:info@netport.com.tr"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    info@netport.com.tr
                  </a>
                </p>
              </address>
            </div>

            {/* Orta sütun — Hızlı Linkler */}
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Hızlı Linkler
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/results"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Raporlarım
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Fiyatlandırma
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.netport.com.tr/tr/iletisim/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    İletişim
                  </a>
                </li>
              </ul>
            </div>

            {/* Sağ sütun — Sosyal Medya */}
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Bizi Takip Edin
              </h3>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.linkedin.com/company/netportglobal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white transition-all duration-200"
                  aria-label="LinkedIn"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Alt kısım — Copyright */}
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <p className="text-center text-xs text-slate-500">
              2026 &copy; Netport Global A.&zwnj;Ş. &mdash; AI destekli ihracat
              çözümü StrategAI
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
