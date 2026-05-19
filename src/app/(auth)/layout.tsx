import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 bg-white rounded-xl shadow-lg px-4 py-2">
            <Image
              src="/netport-logo.png"
              alt="Netport"
              width={160}
              height={40}
              priority
              className="h-9 w-auto"
            />
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-[var(--accent)] text-white">
              AI
            </span>
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
