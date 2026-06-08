import { describe, it, expect } from 'vitest'
import { HS_ENTRIES, lookupHs } from '@/lib/gtip/hs-data'

describe('hs-data', () => {
  it('veri seti yüklendi (5000+ kalem)', () => {
    expect(HS_ENTRIES.length).toBeGreaterThan(5000)
  })
  it('1509 (zeytinyağı) nomenklatürde var', () => {
    const e = lookupHs('1509')
    expect(e).toBeDefined()
    expect(e!.description.toLowerCase()).toContain('olive')
  })
  it('12 haneli GTİP\'i HS6\'ya indirger', () => {
    // 150990 dataset'te mevcut bir HS6 kodu (zeytinyağı alt başlığı)
    expect(lookupHs('150990000011')?.code).toBe('150990')
  })
})
