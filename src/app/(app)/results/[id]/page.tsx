import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PHASE_LABELS: Record<number, string> = {
  1: 'Araştırma & Hazırlık',
  2: 'Konumlandırma & İletişim',
  3: 'İlk Temas & Satış',
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: report } = await supabase
    .from('reports').select('*').eq('id', id).single()

  if (!report) notFound()

  const inputs = report.input_json as Record<string, string>

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/results">
          <Button variant="ghost" size="sm">← Geri</Button>
        </Link>
        <Badge variant="outline">{PHASE_LABELS[report.phase]}</Badge>
        <span className="text-sm text-slate-400">
          {new Date(report.created_at).toLocaleDateString('tr-TR')}
        </span>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {Object.entries(inputs).map(([k, v]) => (
          <span key={k} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {k}: {v}
          </span>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-6 leading-relaxed text-sm whitespace-pre-wrap">
        {report.output_text}
      </div>
    </div>
  )
}
