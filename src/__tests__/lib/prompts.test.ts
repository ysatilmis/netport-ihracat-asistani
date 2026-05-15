import { describe, it, expect } from 'vitest'
import { fillTemplate, extractPlaceholders } from '@/lib/prompts'

describe('fillTemplate', () => {
  it('replaces [ürün] and [ülke] with provided values', () => {
    const template = '[ürün] için en uygun 3 pazarı [ülke] dahil listele.'
    const result = fillTemplate(template, { ürün: 'el yapımı seramik', ülke: 'Almanya' })
    expect(result).toBe('el yapımı seramik için en uygun 3 pazarı Almanya dahil listele.')
  })

  it('leaves missing placeholders as-is', () => {
    const template = '[ürün] ve [ülke] analizi'
    const result = fillTemplate(template, { ürün: 'seramik' })
    expect(result).toBe('seramik ve [ülke] analizi')
  })

  it('handles empty inputs', () => {
    const template = 'Sabit metin'
    expect(fillTemplate(template, {})).toBe('Sabit metin')
  })
})

describe('extractPlaceholders', () => {
  it('extracts all placeholders from template text', () => {
    const template = '[ürün] için [ülke] pazarı ve [sektör] analizi'
    expect(extractPlaceholders(template)).toEqual(['ürün', 'ülke', 'sektör'])
  })

  it('returns empty array when no placeholders', () => {
    expect(extractPlaceholders('Sabit metin')).toEqual([])
  })

  it('deduplicates repeated placeholders', () => {
    expect(extractPlaceholders('[ürün] ve [ürün]')).toEqual(['ürün'])
  })
})
