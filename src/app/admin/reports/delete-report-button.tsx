'use client'

import { useTransition } from 'react'
import { deleteAnyReport } from '@/actions/admin'

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) return
    startTransition(async () => {
      try {
        await deleteAnyReport(reportId)
      } catch {
        alert('Rapor silinemedi.')
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
    >
      {pending ? (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
      {pending ? 'Siliniyor...' : 'Sil'}
    </button>
  )
}
