import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { REPORT_SECTIONS } from '@/lib/report-prompts'
import { PrintButton } from '@/components/print-button'

interface Props {
  params: Promise<{ id: string }>
}

function unwrapTablesInCodeFences(input: string): string {
  let text = input.replace(/\r\n/g, '\n')
  text = text.replace(
    /```[a-zA-Z]*\s*\n((?:[ \t]*\|[^\n]+\n){2,})```/g,
    (_, table) => `\n${table}\n`,
  )
  text = text.replace(
    /^(\|[^\n]+\n)(?!\|[- :]+\|)(\|[^\n]+\n)/gm,
    (_, header, data) => {
      const colCount = (header.match(/\|/g) || []).length - 1
      const sep = '|' + Array(colCount).fill(' --- ').join('|') + '|\n'
      return header + sep + data
    },
  )
  return text
}

const FORBIDDEN_DATA_GAP_PHRASES = [
  'veri bulunamadı',
  'veri bulunmadı',
  'veri yok',
  'verisi yok',
  'verisi yoktur',
  'veri mevcut değil',
  'veri bulunamamaktadır',
  'bilgi yok',
  'bilgi bulunamadı',
  'mevcut değil',
  'bulunmamaktadır',
  'elde edilemedi',
  'bilinmiyor',
]

function softenDataGaps(input: string): string {
  const escaped = FORBIDDEN_DATA_GAP_PHRASES.map((p) =>
    p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  ).join('|')
  const wrappedRe = new RegExp(
    `\\*\\*\\s*(?:${escaped})\\s*\\*\\*|==\\s*(?:${escaped})\\s*==`,
    'gi',
  )
  let out = input.replace(wrappedRe, '*~ tahmini veri yok*')
  const plainRe = new RegExp(`(?<![\\*\\w])(?:${escaped})(?!\\*)`, 'gi')
  out = out.replace(plainRe, '*~ tahmini veri yok*')
  out = out.replace(
    /^[ \t]*[-*•]\s+[^:\n]{1,60}:\s*\*~ tahmini veri yok\*\s*[.,;:!?]*\s*\n?/gm,
    '',
  )
  return out
}

function styleKaynakCitations(input: string): string {
  return input.replace(
    /\[Kaynak:\s*([^\]]+)\]/g,
    (_, citationRaw: string) => {
      const citation = citationRaw.trim()
      const urlMatch = citation.match(/(https?:\/\/[^\s,)]+)/)
      if (!urlMatch) return `*[Kaynak: ${citation}]*`
      const url = urlMatch[1]
      const labelRaw = citation.replace(url, '').replace(/[,;:\s]+$/, '').replace(/^[,;:\s]+/, '').trim()
      let label = labelRaw
      if (!label) {
        try {
          label = new URL(url).hostname.replace(/^www\./, '')
        } catch { label = url }
      }
      return `[*[Kaynak: ${label}]*](${url})`
    },
  )
}

function buildFullReportMarkdown(reportSections: Record<string, { title: string; text: string; phase: number }> | null): string {
  if (!reportSections) return ''
  return REPORT_SECTIONS
    .filter((s) => reportSections[s.key])
    .map((s) => `## ${s.title}\n\n${reportSections[s.key].text}`)
    .join('\n\n---\n\n')
}

export default async function ReportPdfPage({ params }: Props) {
  try {
  const { id } = await params

  let supabase
  try {
    supabase = await createClient()
  } catch (e) {
    return <ErrorDisplay title="Oturum hatası" message="Lütfen tekrar giriş yapın." detail={String(e)} />
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h1>Oturum açmanız gerekiyor</h1>
        <p>Bu sayfayı görüntülemek için lütfen giriş yapın.</p>
        <a href="/login" style={{ color: '#E8560A' }}>Giriş Yap</a>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report, error } = await (supabase.from('reports') as any)
    .select('id, input_json, output_text, report_sections, is_full_report, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: Record<string, unknown> | null; error: unknown }

  if (error || !report) {
    if (error) console.error('[pdf] supabase error:', error)
    return notFound()
  }

  const inputJson = (report.input_json ?? {}) as Record<string, string>
  const product = inputJson.product ?? 'Ürün'
  const country = inputJson.country ?? ''
  const dateStr = new Date(report.created_at as string).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const pdfTitle = `${product}${country ? ` → ${country}` : ''} | Netport Rapor`

  const isFullReport = report.is_full_report === true
  const reportSections = report.report_sections as Record<string, { title: string; text: string; phase: number }> | null

  const rawText = isFullReport && reportSections
    ? buildFullReportMarkdown(reportSections)
    : String(report.output_text ?? '')

  const cleaned = softenDataGaps(styleKaynakCitations(unwrapTablesInCodeFences(rawText)))

  const css = `
    @page { margin: 18mm 15mm; size: A4; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      h2 { break-before: page; }
      h2:first-of-type { break-before: avoid; }
      table, pre { break-inside: avoid; }
      hr { break-after: avoid; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      font-size: 10.5pt; line-height: 1.65; color: #1a1a2e;
      max-width: 210mm; margin: 0 auto; padding: 8mm 0;
    }
    .btn {
      display: inline-block; padding: 10px 20px; background: #E8560A;
      color: white; border: none; border-radius: 8px; cursor: pointer;
      font-size: 11pt; font-weight: 600;
    }
    header { border-bottom: 3px solid #0F2D5C; padding-bottom: 10px; margin: 0 5mm 24px; }
    header h1 { font-size: 20pt; color: #0F2D5C; }
    header .meta { font-size: 9pt; color: #64748b; margin-top: 6px; }
    h2 { font-size: 14pt; color: #0F2D5C; margin: 24px 5mm 10px; padding-bottom: 6px; border-bottom: 2px solid #E8560A; }
    h3 { font-size: 12pt; color: #334155; margin: 16px 5mm 8px; }
    h4 { font-size: 11pt; color: #0F2D5C; margin: 12px 5mm 6px; }
    p { margin: 6px 5mm; }
    ul, ol { margin: 8px 10mm; padding-left: 12px; }
    li { margin: 4px 0; line-height: 1.6; }
    strong { color: #0F2D5C; font-weight: 600; }
    em { color: #94a3b8; font-size: 0.92em; }
    table { width: calc(100% - 10mm); margin: 12px 5mm; border-collapse: collapse; font-size: 9pt; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; vertical-align: top; }
    th { background: #0F2D5C; color: white; font-weight: 600; font-size: 9pt; }
    tr:nth-child(even) td { background: #f8fafc; }
    code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 9pt; font-family: 'Consolas', 'Monaco', monospace; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; margin: 10px 5mm; overflow-x: auto; font-size: 9pt; white-space: pre-wrap; border-radius: 6px; }
    pre code { background: none; padding: 0; }
    a { color: #0F2D5C; text-decoration: underline; }
    blockquote { border-left: 4px solid #E8560A; margin: 12px 5mm; padding: 10px 14px; background: #FFF7ED; border-radius: 0 8px 8px 0; color: #334155; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 5mm; }
    .footer { margin: 30px 5mm 0; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 8pt; color: #94a3b8; text-align: center; }
  `

  return (
    <>
      <style>{css}</style>

      <div className="no-print" style={{ textAlign: 'right', margin: '0 5mm 12px' }}>
        <PrintButton />
      </div>

      <header>
        <h1>Netport İhracat Pazar Araştırma Raporu</h1>
        <div className="meta">
          Ürün: <strong>{product}</strong>
          {country && <> · Hedef Ülke: <strong>{country}</strong></>}
          {' · '}Tarih: {dateStr}
        </div>
      </header>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
          h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
          h4: ({ children, ...props }) => <h4 {...props}>{children}</h4>,
          table: ({ children, ...props }) => <table {...props}>{children}</table>,
          thead: ({ children, ...props }) => <thead {...props}>{children}</thead>,
          th: ({ children, ...props }) => <th {...props}>{children}</th>,
          td: ({ children, ...props }) => <td {...props}>{children}</td>,
          pre: ({ children, ...props }) => <pre {...props}>{children}</pre>,
          code: ({ children, className, ...props }) => {
            const isBlock = className?.startsWith('language-') ?? false
            if (isBlock) return <code className={className} {...props}>{children}</code>
            return <code {...props}>{children}</code>
          },
          blockquote: ({ children, ...props }) => <blockquote {...props}>{children}</blockquote>,
          hr: () => <hr />,
          a: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
          img: ({ src, alt }) => (
            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
              [Görsel: {alt || (typeof src === 'string' ? src : '')}]
            </span>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>

      <div className="footer">
        Netport İhracat Asistanı · StrategAI Solutions · {new Date().getFullYear()}
      </div>
    </>
  )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const stack = e instanceof Error ? e.stack : ''
    console.error('[pdf] render error:', msg, stack)
    return <ErrorDisplay title="Rapor yüklenemedi" message={msg} detail={stack} />
  }
}

function ErrorDisplay({ title, message, detail }: { title: string; message: string; detail?: string }) {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 700, margin: '40px auto' }}>
      <h1 style={{ color: '#dc2626', fontSize: '1.5rem', marginBottom: 12 }}>{title}</h1>
      <p style={{ color: '#334155', marginBottom: 8 }}>{message}</p>
      {detail && (
        <pre style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', padding: 16, borderRadius: 8,
          fontSize: '0.8rem', overflow: 'auto', maxHeight: 400, whiteSpace: 'pre-wrap'
        }}>
          {detail}
        </pre>
      )}
      <a href="/dashboard" style={{ color: '#E8560A', display: 'inline-block', marginTop: 16 }}>Dashboard'a Dön</a>
    </div>
  )
}
