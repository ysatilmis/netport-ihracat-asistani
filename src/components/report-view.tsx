'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ReportSection } from './report-section'
import { saveFullReport } from '@/actions/reports'
import { REPORT_SECTIONS } from '@/lib/report-prompts'
import { useRouter } from 'next/navigation'

interface ReportViewProps {
  product: string
  country: string
  sections: Record<string, { title: string; text: string; phase: number }>
  streamingSectionKey?: string
}

export function ReportView({ product, country, sections, streamingSectionKey }: ReportViewProps) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setSaving(true)
    try {
      const id = await saveFullReport({ product, country, sections })
      setSaved(true)
      if (id) router.push(`/results/${id}`)
    } finally {
      setSaving(false)
    }
  }

  const isComplete = Object.keys(sections).length === REPORT_SECTIONS.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
            📄 {product} — İhracat Raporu
          </h2>
          {country && (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Hedef pazar: {country}
            </p>
          )}
        </div>
        {isComplete && !saved && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {saving ? 'Kaydediliyor...' : '💾 Raporu Kaydet'}
          </Button>
        )}
        {saved && (
          <span className="text-sm font-medium text-green-600">✓ Kaydedildi</span>
        )}
      </div>

      {REPORT_SECTIONS.map((section) => {
        const data = sections[section.key]
        if (!data) return null
        return (
          <ReportSection
            key={section.key}
            title={section.title}
            text={data.text}
            phase={section.phase}
            isStreaming={streamingSectionKey === section.key}
          />
        )
      })}
    </div>
  )
}
