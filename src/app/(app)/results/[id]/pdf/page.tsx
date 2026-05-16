import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Rapor PDF — Netport İhracat Asistanı',
}

export default async function ReportPdfPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report } = await (supabase.from('reports') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as {
      data: {
        id: string
        input_json: Record<string, string>
        output_text: string
        report_sections: Record<string, { title: string; text: string; phase: number }> | null
        created_at: string
        is_full_report: boolean
      } | null
      error: unknown
    }

  if (!report) return notFound()

  const product = report.input_json?.product ?? 'Ürün'
  const country = report.input_json?.country ?? ''
  const fullText = report.output_text

  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <title>Netport Rapor — {product}{country ? ` → ${country}` : ''}</title>
        <style>{`
          @page { margin: 20mm 15mm; size: A4; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a2e;
            max-width: 210mm;
            margin: 0 auto;
            padding: 10mm;
          }
          header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 8px;
            margin-bottom: 24px;
          }
          header h1 { font-size: 18pt; color: #1e3a5f; }
          header .meta { font-size: 9pt; color: #64748b; margin-top: 4px; }
          h2 { font-size: 14pt; color: #1e3a5f; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          h3 { font-size: 12pt; color: #334155; margin: 14px 0 6px; }
          p { margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; color: #1e3a5f; }
          code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }
          pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; overflow-x: auto; font-size: 9pt; white-space: pre-wrap; }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
          .footer { margin-top: 30px; padding-top: 8px; border-top: 1px solid #cbd5e1; font-size: 8pt; color: #94a3b8; text-align: center; }
          .btn { display: inline-block; padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 10pt; }
          .btn:hover { background: #1d4ed8; }
        `}</style>
      </head>
      <body>
        <div className="no-print" style={{ textAlign: 'right', marginBottom: '12px' }}>
          <button className="btn" onClick={() => window.print()}>Yazdır / PDF Kaydet</button>
        </div>

        <header>
          <h1>Netport İhracat Pazar Araştırma Raporu</h1>
          <div className="meta">
            Ürün: <strong>{product}</strong>
            {country && <> · Hedef Ülke: <strong>{country}</strong></>}
            {' · '}Tarih: {new Date(report.created_at).toLocaleDateString('tr-TR')}
          </div>
        </header>

        <div
          dangerouslySetInnerHTML={{
            __html: fullText
              .replace(/^# /gm, '## ')
              .replace(/^#{3,}/gm, '###')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/^- (.+)$/gm, '<li>$1</li>')
              .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
              .replace(/\n\n/g, '</p><p>')
              .replace(/^/g, '<p>')
              .replace(/$/g, '</p>'),
          }}
        />

        <div className="footer">
          Netport İhracat Asistanı · StrategAI Solutions · {new Date().getFullYear()}
        </div>
      </body>
    </html>
  )
}
