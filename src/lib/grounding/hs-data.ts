import raw from './data/hs-nomenclature.json'

export interface HsEntry {
  code: string        // 2/4/6 haneli HS kodu (sadece rakam)
  description: string
  level: 2 | 4 | 6
}

export const HS_ENTRIES = raw as HsEntry[]

const BY_CODE = new Map(HS_ENTRIES.map((e) => [e.code, e]))

/** Tam koddan (12 haneye kadar GTİP) HS6/HS4/HS2 girişini bulur. */
export function lookupHs(code: string): HsEntry | undefined {
  const d = code.replace(/\D/g, '')
  return BY_CODE.get(d.slice(0, 6)) ?? BY_CODE.get(d.slice(0, 4)) ?? BY_CODE.get(d.slice(0, 2))
}
