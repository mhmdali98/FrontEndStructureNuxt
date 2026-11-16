import { describe, expect, it } from 'vitest'
import { createFormatter, localeTag } from '../app/composables/useFormat'

describe('useFormat formatters', () => {
  it('builds pinned locale tags', () => {
    expect(localeTag('en', 'arab')).toBe('en-US')
    expect(localeTag('ar', 'latn')).toBe('ar-u-nu-latn')
    expect(localeTag('ar', 'arab')).toBe('ar-u-nu-arab')
  })
  it('formats numbers per numbering system', () => {
    expect(createFormatter('en-US').number(1234.5)).toBe('1,234.5')
    expect(createFormatter('ar-u-nu-latn').number(1234)).toMatch(/1.?234/)
    expect(createFormatter('ar-u-nu-arab').number(12)).toBe('١٢')
  })
  it('formats compact, percent and currency', () => {
    const f = createFormatter('en-US')
    expect(f.compact(36900)).toBe('36.9K')
    expect(f.percent(0.125)).toBe('12.5%')
    expect(f.currency(1200)).toBe('$1,200')
  })
  it('formats relative time', () => {
    const now = Date.UTC(2026, 10, 16, 12)
    expect(createFormatter('en-US').relative(now - 3 * 3600_000, now)).toBe('3 hours ago')
    expect(createFormatter('en-US').relative(now - 86_400_000, now)).toBe('yesterday')
  })
})
