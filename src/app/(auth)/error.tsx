'use client'

export default function AuthError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Bir şeyler ters gitti</h2>
      <p className="text-sm text-slate-500 mb-6">Lütfen tekrar deneyin.</p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        Tekrar Dene
      </button>
    </div>
  )
}
