'use client'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 border border-red-200 mb-5">
        <span className="text-2xl" aria-hidden>!</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Bir şeyler ters gitti</h2>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        Sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar denemeyi dene.
      </p>
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
