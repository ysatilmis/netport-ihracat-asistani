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

export function Markdown({ children }: MarkdownProps) {
  const cleaned = unwrapTablesInCodeFences(children)
  return (
    <div
      className="prose prose-slate max-w-none
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-h1:text-2xl prose-h1:text-slate-900 prose-h1:mt-6 prose-h1:mb-3
        prose-h2:text-xl prose-h2:text-slate-900 prose-h2:mt-5 prose-h2:mb-2.5
        prose-h3:text-lg prose-h3:text-slate-800 prose-h3:mt-4 prose-h3:mb-2
        prose-h4:text-base prose-h4:text-slate-700 prose-h4:mt-3 prose-h4:mb-1.5
        prose-p:my-2.5 prose-p:leading-7 prose-p:text-slate-800
        prose-strong:text-[var(--primary)] prose-strong:font-semibold
        prose-em:text-slate-700
        prose-a:text-blue-700 prose-a:no-underline hover:prose-a:underline
        prose-ul:my-2.5 prose-ol:my-2.5 prose-li:my-1 prose-li:leading-7
        prose-li:marker:text-slate-400
        prose-blockquote:border-l-2 prose-blockquote:border-slate-300
        prose-blockquote:pl-4 prose-blockquote:text-slate-600 prose-blockquote:italic
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
