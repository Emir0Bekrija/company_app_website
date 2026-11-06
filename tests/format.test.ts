import { describe, expect, it } from 'vitest'
import { formatLongDate, formatMoney, formatMonth, formatNumber, formatShortDate, weekdayNames } from '@/lib/format'

const nbsp = (s: string) => s.replace(/ /g, ' ')

describe('Bosnian formatting', () => {
  it('spells dates out in Bosnian', () => {
    const d = new Date(2026, 10, 5)
    expect(formatLongDate('bs', d)).toBe('četvrtak, 5. novembar')
    expect(formatShortDate('bs', d)).toBe('5. nov')
    expect(formatMonth('bs', 2026, 11)).toBe('novembar 2026.')
    expect(weekdayNames('bs')).toEqual(['pon', 'uto', 'sri', 'čet', 'pet', 'sub', 'ned'])
  })

  it('puts the euro sign after the amount', () => {
    expect(nbsp(formatMoney('bs', 9290.5, 2))).toBe('9.290,50 €')
    expect(nbsp(formatMoney('bs', 5, 0))).toBe('5 €')
    expect(formatNumber('bs', 5175)).toBe('5.175')
  })
})

describe('English formatting', () => {
  it('uses British conventions', () => {
    expect(formatMoney('en', 9290.5, 2)).toBe('€9,290.50')
    expect(formatMonth('en', 2026, 11)).toBe('November 2026')
    expect(weekdayNames('en')[0]).toBe('Mon')
  })
})
