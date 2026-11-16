import { describe, expect, it } from 'vitest'
import { parseAppearance } from '../app/utils/appearance'
import { DEFAULT_APPEARANCE } from '../shared/types/appearance'

describe('appearance cookie schema', () => {
  it('returns defaults for empty or corrupt input', () => {
    expect(parseAppearance(undefined)).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('{not json')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance(42)).toEqual(DEFAULT_APPEARANCE)
  })
  it('keeps valid fields and resets invalid ones independently', () => {
    const v = parseAppearance({ primary: 'rose', secondary: 'nope', radius: 0.5, layout: 'topnav', sidebarCollapsed: 'yes' })
    expect(v.primary).toBe('rose')
    expect(v.secondary).toBe(DEFAULT_APPEARANCE.secondary)
    expect(v.radius).toBe(0.5)
    expect(v.layout).toBe('topnav')
    expect(v.sidebarCollapsed).toBe(DEFAULT_APPEARANCE.sidebarCollapsed)
  })
  it('parses JSON strings', () => {
    expect(parseAppearance(JSON.stringify({ density: 'compact' })).density).toBe('compact')
  })
})
