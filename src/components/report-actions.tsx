'use client'
import { useState } from 'react'

interface ReportActionsProps {
  reportId: string
  fullMarkdown: string
}

type CopiedKind = 'markdown' | 'link' | null

export function ReportActions({ reportId, fullMarkdown }: ReportActionsProps) {
  const [copied, setCopied] = useState<CopiedKind>(null)

  const handleCopy = async (kind: 'markdown' | 'link', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard not available
    }
  }

  return (
    <div
      className="print:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30
        flex items-center gap-0.5 p-1.5 rounded-full
        bg-slate-900/95 backdrop-blur-sm shadow-xl border border-slate-800"
      role="toolbar"
      aria-label="Rapor eylemleri"
    >
      <ActionButton
        onClick={() =>
          handleCopy(
            'markdown',
            fullMarkdown,
          )
        }
      >
        {copied === 'markdown' ? '✓ Kopyalandı' : '📋 Markdown'}
      </ActionButton>
      <Divider />
      <ActionButton onClick={() => window.open(`/pdf/${reportId}`, '_blank')}>
        🖨️ Yazdır / PDF
      </ActionButton>
      <Divider />
      <ActionButton
        onClick={() =>
          handleCopy(
            'link',
            `${window.location.origin}/results/${reportId}`,
          )
        }
      >
        {copied === 'link' ? '✓ Link alındı' : '🔗 Link kopyala'}
      </ActionButton>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium
        text-white/90 hover:text-white hover:bg-white/10 transition-colors
        whitespace-nowrap"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="w-px h-5 bg-white/10" aria-hidden />
}
