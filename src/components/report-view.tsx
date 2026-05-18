'use client'
import { ReportSection } from './report-section'
import { DEEP_DIVE_SECTIONS } from '@/lib/report-prompts'

interface ReportViewProps {
  product: string
  country: string
  sections: Record<string, { title: string; text: string; phase: number }>
  streamingSectionKey?: string
  countriesText?: string
}

export function ReportView({ product, country, sections, streamingSectionKey }: ReportViewProps) {
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
      </div>

      {DEEP_DIVE_SECTIONS.map((section) => {
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
