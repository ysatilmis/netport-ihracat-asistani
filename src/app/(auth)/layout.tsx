import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3 bg-white rounded-2xl shadow-lg px-6 py-3">
            <Image
              src="/netport-logo.png"
              alt="Netport"
              width={400}
              height={400}
              priority
              className="h-16 w-16 object-contain"
            />
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-[var(--accent)] text-white shadow-sm">
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
