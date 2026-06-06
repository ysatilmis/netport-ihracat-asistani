import { describe, it, expect } from 'vitest'
import { matchCommonExport } from '@/lib/grounding/common-tr-exports'

describe('matchCommonExport', () => {
  it('zeytinyağı → 1509', () => {
    expect(matchCommonExport('organik zeytinyağı')?.code).toBe('1509')
  })
  it('prina yağı 1509 ile karışmaz → 1510', () => {
    expect(matchCommonExport('prina yağı')?.code).toBe('1510')
  })
  it('eşleşme yoksa undefined', () => {
    expect(matchCommonExport('kuantum bilgisayar')).toBeUndefined()
  })
})
