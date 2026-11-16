import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { diffKeys, flattenKeys } from '../check-i18n.mjs'

describe('check-i18n', () => {
  it('flattens nested keys', () => {
    expect(flattenKeys({ a: { b: 'x', c: { d: 'y' } }, e: 'z' })).toEqual(['a.b', 'a.c.d', 'e'])
  })
  it('reports differences', () => {
    expect(diffKeys({ a: 'x', b: 'y' }, { a: 'x', c: 'z' })).toEqual({ onlyInFirst: ['b'], onlyInSecond: ['c'] })
  })
  it('every layer has en/ar parity', () => {
    const root = join(__dirname, '../..')
    for (const layer of readdirSync(join(root, 'layers'))) {
      const dir = join(root, 'layers', layer, 'i18n/locales')
      const en = JSON.parse(readFileSync(join(dir, 'en.json'), 'utf8'))
      const ar = JSON.parse(readFileSync(join(dir, 'ar.json'), 'utf8'))
      expect(diffKeys(en, ar), layer).toEqual({ onlyInFirst: [], onlyInSecond: [] })
    }
  })
})
