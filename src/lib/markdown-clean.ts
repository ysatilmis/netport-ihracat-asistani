// Shared markdown cleanup utilities used by both the web report renderer
// (components/markdown.tsx) and the PDF generator (lib/pdf/*). Previously these
// were duplicated across markdown.tsx and the now-removed browser-print pages.

/**
 * LLM bazen markdown tablosunu ``` ``` kod blokuna sarar — bu tablo render
 * edilmeyip ham pipe karakterleriyle görünür. Pipe-only satır içeren plain
 * code fence'leri tespit edip ham tabloya dönüştürüyoruz; böylece remark-gfm
 * tabloyu doğru parse eder.
 */
export function unwrapTablesInCodeFences(input: string): string {
  let text = input.replace(/\r\n/g, '\n')
  // Unwrap tables trapped inside code fences (1+ pipe-only lines)
  text = text.replace(
    /```[a-zA-Z]*\s*\n((?:[ \t]*\|[^\n]+\n)+)```/g,
    (_, table) => `\n${table}\n`,
  )
  // Fix tables missing GFM separator line: if a pipe-only line is followed
  // by another pipe line but no separator, inject one.
  text = text.replace(
    /^(\|[^\n]+\n)(?!\|[- :]+\|)(\|[^\n]+\n)/gm,
    (_, header, data) => {
      const colCount = (header.match(/\|/g) || []).length - 1
      const sep = '|' + Array(colCount).fill(' --- ').join('|') + '|\n'
      return header + sep + data
    },
  )
  // Fix single-line pipe tables (header only, no data) — add separator
  text = text.replace(
    /^(\|[^\n|]+\|[^\n]*\n)(?!\|[- :]+\|)(?!\|[^\n]+\|)/gm,
    (match) => {
      const colCount = (match.match(/\|/g) || []).length - 1
      if (colCount < 1) return match
      const sep = '|' + Array(colCount).fill(' --- ').join('|') + '|\n'
      return match + sep
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

/**
 * LLM bazen "veri bulunamadı / bilgi yok / mevcut değil" gibi ifadeleri **bold**
 * veya ==mark== ile vurgulayarak rapor algısını zayıflatır. Bunları soft gri
 * italik "~" pattern'ine çeviriyoruz; tek başına bullet'ları tamamen siliyoruz.
 */
export function softenDataGaps(input: string): string {
  const escaped = FORBIDDEN_DATA_GAP_PHRASES.map((p) =>
    p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  ).join('|')
  // 1. **veri bulunamadı** / ==veri bulunamadı== → italic mute
  const wrappedRe = new RegExp(
    `\\*\\*\\s*(?:${escaped})\\s*\\*\\*|==\\s*(?:${escaped})\\s*==`,
    'gi',
  )
  let out = input.replace(wrappedRe, '*~*')
  // 2. plain text occurence (bold/mark wrap olmadan) → minimal tilde
  const plainRe = new RegExp(`(?<![\\*\\w])(?:${escaped})(?!\\*)`, 'gi')
  out = out.replace(plainRe, '*~*')
  // 3. Bullet/lines containing only data-gap → satırı sil
  out = out.replace(
    /^[ \t]*[-*•]\s+[^:\n]{1,80}:\s*\*~\*\s*[.,;:!?]*\s*\n?/gm,
    '',
  )
  // 4. Lines with ⚠️ Tahmini değer pattern → sil
  out = out.replace(/^.*⚠[️️]?\s*Tahmini değer.*(?:\n|$)/gm, '')
  return out
}

/**
 * [Kaynak: ...] paternlerini italikleştirir. İçinde URL varsa tıklanabilir
 * markdown link'e çevirir; URL yoksa sadece italik text.
 */
export function styleKaynakCitations(input: string): string {
  return input.replace(
    /\[Kaynak:\s*([^\]]+)\]/g,
    (_, citationRaw: string) => {
      const citation = citationRaw.trim()
      const urlMatch = citation.match(/(https?:\/\/[^\s,)]+)/)
      if (!urlMatch) {
        return `*[Kaynak: ${citation}]*`
      }
      const url = urlMatch[1]
      const labelRaw = citation
        .replace(url, '')
        .replace(/[,;:\s]+$/, '')
        .replace(/^[,;:\s]+/, '')
        .trim()
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

/** Tüm temizleme adımlarını sırayla uygular. */
export function cleanReportMarkdown(input: string): string {
  return softenDataGaps(styleKaynakCitations(unwrapTablesInCodeFences(input)))
}
