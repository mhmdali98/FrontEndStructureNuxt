import { describe, expect, it } from 'vitest'
import { findPhysicalClasses, scanSource } from '../check-rtl.mjs'

describe('check-rtl', () => {
  it.each(['ml-2', 'sm:-mr-1', 'rounded-tl-md', 'left-0', 'start-0', 'border-l', 'text-right', 'hover:pr-4'])('flags %s', (c) => {
    expect(findPhysicalClasses(c)).toEqual([c])
  })
  it.each(['rounded-lg', 'border-red-500', 'items-start', 'justify-end', 'text-start', 'ms-2', 'inset-s-0', 'i-lucide-arrow-left', 'trend-up'])('does not flag %s', (c) => {
    expect(findPhysicalClasses(c)).toEqual([])
  })
  it('only scans class contexts and honours rtl-ok', () => {
    const src = [
      `<div class="flex ml-2">`,
      `const pos = 'bottom-left'`,
      `const url = 'backend-url'`,
      `<div :class="active ? 'pl-4' : 'ps-4'">`,
      `<div class="left-0"> <!-- rtl-ok: decorative blob -->`,
    ].join('\n')
    expect(scanSource(src)).toEqual([{ line: 1, token: 'ml-2' }, { line: 4, token: 'pl-4' }])
  })
})
