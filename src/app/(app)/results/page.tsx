import { getReports } from '@/actions/reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const PHASE_LABELS: Record<number, string> = {
  1: 'Araştırma',
  2: 'Konumlandırma',
  3: 'İlk Temas',
}

export default async function ResultsPage() {
  const reports = await getReports()

  if (reports.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-lg mb-2">Henüz kaydedilmiş analiz yok.</p>
        <p className="text-sm">Dashboard&apos;dan bir analiz yapıp kaydedin.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Raporlarım</h1>
      <div className="grid gap-3">
        {reports.map((r) => (
          <Link key={r.id} href={`/results/${r.id}`}>
            <Card className="hover:border-blue-300 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{r.prompt_key.replace(/_/g, ' ')}</CardTitle>
                  <Badge variant="outline">{PHASE_LABELS[r.phase] ?? `Aşama ${r.phase}`}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 line-clamp-2">{r.output_text}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(r.created_at).toLocaleDateString('tr-TR')}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
