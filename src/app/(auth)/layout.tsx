import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center mb-4 bg-white rounded-2xl shadow-2xl px-10 py-6">
            <Image
              src="/netport-logo.png"
              alt="Netport"
              width={400}
              height={400}
              priority
              className="h-28 w-auto object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider bg-[var(--accent)] text-white shadow-sm">
              AI
            </span>
            <span className="text-xs uppercase tracking-wider text-blue-200/80 font-semibold">İhracat Asistanı</span>
          </div>
          <p className="text-sm text-blue-200">İhracat Asistanı — Yapay Zeka Destekli Pazar Analizi</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
