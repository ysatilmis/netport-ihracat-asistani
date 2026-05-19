import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  children: string
}

/**
 * LLM bazen markdown tablosunu ``` ``` kod blokuna sarar — bu tablo render
 * edilmeyip ham pipe karakterleriyle görünür. Pipe-only satır içeren plain
 * code fence'leri tespit edip ham tabloya dönüştürüyoruz; böylece remark-gfm
 * tabloyu doğru parse eder.
 */
function unwrapTablesInCodeFences(input: string): string {
  return input.replace(
    /```[a-zA-Z]*\s*\n((?:[ \t]*\|[^\n]+\n){2,})```/g,
    (_, table) => `\n${table}\n`,
  )
}

/**
 * [Kaynak: ...] paternlerini italikleştirir. İçinde URL varsa tıklanabilir
 * markdown link'e çevirir; URL yoksa sadece italik text.
 *
 * Örnekler:
 *   [Kaynak: DEİK 2024]            → *[Kaynak: DEİK 2024]*
 *   [Kaynak: https://x.com/path]   → [*[Kaynak: x.com]*](https://x.com/path)
 *   [Kaynak: DEİK https://x.com/]  → [*[Kaynak: DEİK]*](https://x.com/)
 */
function styleKaynakCitations(input: string): string {
  return input.replace(
    /\[Kaynak:\s*([^\]]+)\]/g,
    (_, citationRaw: string) => {
      const citation = citationRaw.trim()
      const urlMatch = citation.match(/(https?:\/\/[^\s,)]+)/)
      if (!urlMatch) {
        return `*[Kaynak: ${citation}]*`
      }
      const url = urlMatch[1]
      const labelRaw = citation.replace(url, '').replace(/[,;:\s]+$/, '').replace(/^[,;:\s]+/, '').trim()
      let label = labelRaw
      if (!label) {
        try {
          label = new URL(url).hostname.replace(/^www\./, '')
        } catch {
          label = url
        }
      }
      return `[*[Kaynak: ${label}]*](${url})`
    },
  )
}

export function Markdown({ children }: MarkdownProps) {
  const cleaned = styleKaynakCitations(unwrapTablesInCodeFences(children))
  return (
    <div
      className="prose prose-slate max-w-none
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-h1:text-2xl prose-h1:text-slate-900 prose-h1:mt-6 prose-h1:mb-3
        prose-h2:text-xl prose-h2:text-[var(--primary)] prose-h2:border-b-2 prose-h2:border-[var(--primary)]/30 prose-h2:pb-1.5 prose-h2:mt-7 prose-h2:mb-4
        prose-h3:text-lg prose-h3:text-slate-900 prose-h3:font-bold prose-h3:mt-5 prose-h3:mb-2.5
        prose-h3:before:content-[''] prose-h3:before:inline-block prose-h3:before:w-1 prose-h3:before:h-5 prose-h3:before:bg-[var(--accent,#f97316)] prose-h3:before:mr-2 prose-h3:before:align-middle prose-h3:before:rounded
        prose-h4:text-base prose-h4:text-[var(--primary)] prose-h4:font-semibold prose-h4:mt-4 prose-h4:mb-1.5
        prose-p:my-2.5 prose-p:leading-7 prose-p:text-slate-700
        prose-strong:text-[var(--primary)] prose-strong:font-semibold
        prose-em:text-slate-500 prose-em:text-sm prose-em:font-normal
        prose-a:text-[var(--primary)] prose-a:no-underline prose-a:font-medium hover:prose-a:underline hover:prose-a:text-[var(--accent,#f97316)]
        prose-ul:my-2.5 prose-ol:my-2.5 prose-li:my-1 prose-li:leading-7
        prose-li:marker:text-[var(--accent,#f97316)]
        prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent,#f97316)]
        prose-blockquote:pl-4 prose-blockquote:text-slate-600 prose-blockquote:italic prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:rounded-r
        prose-code:text-[0.875em] prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-code:before:content-none prose-code:after:content-none prose-code:font-normal
        prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200
        prose-hr:border-slate-200 prose-hr:my-6
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children, ...props }) => (
            <pre
              className="my-4 p-4 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto text-sm leading-6"
              {...props}
            >
              {children}
            </pre>
          ),
          code: ({ children, className, ...props }) => {
            const isBlock = className?.startsWith('language-') ?? false
            if (isBlock) {
              return (
                <code
                  className="text-slate-100 font-mono whitespace-pre"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code
                className="text-[0.875em] bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded font-mono before:content-none after:content-none"
                {...props}
              >
                {children}
              </code>
            )
          },
          table: ({ children, ...props }) => (
            <div className="my-4 sm:-mx-2 overflow-x-auto rounded-lg border border-slate-200">
              <table
                className="w-full border-collapse text-sm"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-slate-100" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th
              className="px-3 py-2 text-left text-xs font-semibold text-slate-900 border-b border-slate-200 whitespace-nowrap"
              {...props}
            >
              {children}
            </th>
          ),
          tr: ({ children, ...props }) => (
            <tr
              className="border-b border-slate-100 last:border-0 even:bg-slate-50/50 hover:bg-slate-50"
              {...props}
            >
              {children}
            </tr>
          ),
          td: ({ children, ...props }) => (
            <td
              className="px-3 py-2 text-sm text-slate-800 align-top leading-6"
              {...props}
            >
              {children}
            </td>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  )
}
