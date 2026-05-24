'use client'

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-xl font-bold text-white mb-2">Bir hata oluştu</h2>
      <p className="text-sm text-slate-400 mb-6">Yönetici paneli yüklenirken hata oluştu.</p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
      >
        Tekrar Dene
      </button>
    </div>
  )
}
