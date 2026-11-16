import { describe, expect, it } from 'vitest'
import { groupPermissions, roleGrants } from '../app/schemas/roles.schema'

describe('roles helpers', () => {
  it('groups permission definitions preserving order', () => {
    const g = groupPermissions([{ key: 'a.x', group: 'a' }, { key: 'b.x', group: 'b' }, { key: 'a.y', group: 'a' }])
    expect(g.map(x => [x.group, x.items.length])).toEqual([['a', 2], ['b', 1]])
  })
  it('resolves grants with wildcards', () => {
    expect(roleGrants(['*'], 'users.view')).toBe(true)
    expect(roleGrants(['users.*'], 'users.delete')).toBe(true)
    expect(roleGrants(['users.view'], 'users.delete')).toBe(false)
  })
})
