'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'

interface PdfDownloadProps {
  reportId: string
  label?: string
}

export function PdfDownload({ reportId, label = 'PDF İndir' }: PdfDownloadProps) {
  const handlePdf = () => {
    const url = `/results/${reportId}/pdf`
    const w = window.open(url, '_blank', 'noopener,noreferrer')
    if (w) {
      // Print dialog opens automatically via onafterprint in pdf page
      w.addEventListener('load', () => {
        setTimeout(() => w.print(), 500)
      })
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePdf}
      className="gap-2"
    >
      <FileDown className="h-4 w-4" />
      {label}
    </Button>
  )
}
