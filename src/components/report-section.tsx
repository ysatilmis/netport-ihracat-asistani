import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PHASE_COLORS = {
  1: { bg: '#EFF6FF', border: '#BFDBFE', badge: 'Araştırma' },
  2: { bg: '#F0FDF4', border: '#BBF7D0', badge: 'Konumlandırma' },
  3: { bg: '#FFF7ED', border: '#FED7AA', badge: 'İlk Temas' },
  4: { bg: '#FAF5FF', border: '#E9D5FF', badge: 'Yönetim Özeti' },
} as const

interface ReportSectionProps {
  title: string
  text: string
  phase: 1 | 2 | 3 | 4
  isStreaming?: boolean
}

export function ReportSection({ title, text, phase, isStreaming }: ReportSectionProps) {
  const colors = PHASE_COLORS[phase]

  return (
    <Card
      className="w-full mb-4"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {colors.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
          {text}
          {isStreaming && <span className="animate-pulse ml-0.5">▌</span>}
        </div>
      </CardContent>
    </Card>
  )
}
