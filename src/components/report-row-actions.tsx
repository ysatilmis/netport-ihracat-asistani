'use client'
import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteReport } from '@/actions/reports'

interface ReportRowActionsProps {
  reportId: string
  reportTitle?: string
}

export function ReportRowActions({ reportId, reportTitle }: ReportRowActionsProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      try {
        await deleteReport(reportId)
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className="absolute top-2 right-2 z-10 w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        aria-label="Raporu sil"
        title="Raporu sil"
      >
        🗑
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raporu sil?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {reportTitle ? <strong>&ldquo;{reportTitle}&rdquo;</strong> : 'Bu rapor'} ve ilgili tüm veriler (alıcı listesi, konumlandırma paketi, sinyal kayıtları) kalıcı olarak silinecek. Geri alınamaz.
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? 'Siliniyor…' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
