import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Sol Hero Panel — dark navy + radial accent + logo pill + bullets */}
      <aside
        className="relative overflow-hidden px-8 py-12 sm:px-12 sm:py-16 lg:flex lg:flex-col lg:justify-between hidden lg:block"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <div
          className="pointer-events-none absolute -top-1/4 -right-1/4 h-2/3 w-2/3 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,86,10,0.25), transparent)' }}
          aria-hidden
        />

        <div className="relative z-10">
          {/* Logo pill (white card) — bugünkü navbar logosuyla tutarlı */}
          <div className="inline-flex items-center gap-3 bg-white rounded-2xl shadow-2xl px-6 py-4 mb-8">
            <Image
              src="/netport-logo.png"
              alt="Netport"
              width={400}
              height={400}
              priority
              className="h-14 w-auto object-contain"
            />
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider bg-[var(--accent)] text-white shadow-sm">
              AI
            </span>
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono uppercase tracking-wider text-white/90 mb-6">
            <span aria-hidden>⬢</span> İhracat Asistanı
          </span>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-[1.1] mb-4 max-w-xl">
            Türk KOBİ'lerinin AI ile ihracat öğrendiği yer.
          </h1>
          <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-md mb-8">
            Pazar analizi, alıcı listesi, soğuk e-posta — hepsi 11 bölümlük tek raporda.
            Perplexity + GPT-4o + Claude orkestrasyonu.
          </p>

          <ul className="space-y-4 max-w-md">
            <li className="flex gap-3 items-start">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12 text-base" aria-hidden>🌍</span>
              <div>
                <strong className="block text-sm font-semibold text-white mb-0.5">Hedef pazar seçimi</strong>
                <span className="text-sm text-white/70">Sektörüne en uygun 3 ülke + market size + rekabet.</span>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12 text-base" aria-hidden>📋</span>
              <div>
                <strong className="block text-sm font-semibold text-white mb-0.5">Alıcı listesi + cold-email</strong>
                <span className="text-sm text-white/70">Doğrulanmış alıcı temas listesi ve müzakere şablonları.</span>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12 text-base" aria-hidden>⚡</span>
              <div>
                <strong className="block text-sm font-semibold text-white mb-0.5">~6 dakikada rapor</strong>
                <span className="text-sm text-white/70">Manuel danışmandan 10× ucuz, 100× hızlı.</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-xs text-white/50 mt-12">
          © 2026 Netport İhracat · Yüksel Satılmış
        </div>
      </aside>

      {/* Sağ Form Panel */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-10 bg-white">
        {/* Mobile-only logo (hero gizli olduğunda) */}
        <div className="lg:hidden absolute top-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-white rounded-xl shadow-md px-4 py-2">
          <Image
            src="/netport-logo.png"
            alt="Netport"
            width={400}
            height={400}
            priority
            className="h-10 w-auto object-contain"
          />
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--accent)] text-white">
            AI
          </span>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  )
}
