import { describe, expect, it } from 'vitest'
import { checkPermissions, filterNavigation, matchPermission, normalizePermissions } from '../app/utils/permissions'
import type { Permission } from '../shared/types/permissions'

const set = (...p: string[]) => new Set(p)

describe('matchPermission', () => {
  it('matches exact permissions', () => {
    expect(matchPermission(set('users.view'), 'users.view')).toBe(true)
    expect(matchPermission(set('users.view'), 'users.create')).toBe(false)
  })
  it('treats * as super admin', () => {
    expect(matchPermission(set('*'), 'anything.at.all')).toBe(true)
  })
  it('supports resource wildcards', () => {
    expect(matchPermission(set('users.*'), 'users.delete')).toBe(true)
    expect(matchPermission(set('users.*'), 'roles.view')).toBe(false)
  })
  it('matches a required wildcard against any action of that resource', () => {
    expect(matchPermission(set('users.view'), 'users.*')).toBe(true)
    expect(matchPermission(set('roles.view'), 'users.*')).toBe(false)
  })
})

describe('checkPermissions', () => {
  const s = set('users.view', 'roles.view')
  it('passes when nothing is required', () => {
    expect(checkPermissions(s, undefined)).toBe(true)
    expect(checkPermissions(s, [])).toBe(true)
  })
  it('defaults to all', () => {
    expect(checkPermissions(s, ['users.view', 'roles.view'] as Permission[])).toBe(true)
    expect(checkPermissions(s, ['users.view', 'users.create'] as Permission[])).toBe(false)
  })
  it('supports any', () => {
    expect(checkPermissions(s, ['users.create', 'roles.view'] as Permission[], 'any')).toBe(true)
    expect(checkPermissions(s, ['users.create', 'roles.manage'] as Permission[], 'any')).toBe(false)
  })
})

describe('normalizePermissions', () => {
  it('maps Spatie-style and object shapes', () => {
    expect(normalizePermissions(['edit articles', { name: 'Users.View' }, 'roles:manage', '*', 42])).toEqual(['articles.edit', 'users.view', 'roles.manage', '*'])
  })
  it('returns [] for junk', () => {
    expect(normalizePermissions(null)).toEqual([])
  })
})

describe('filterNavigation', () => {
  const routes: Record<string, { permissions?: Permission[] }> = {
    '/': { permissions: ['dashboard.view'] as Permission[] },
    '/users': { permissions: ['users.view'] as Permission[] },
    '/roles': { permissions: ['roles.view'] as Permission[] },
  }
  const resolve = (to: string) => routes[to] ? { exists: true, ...routes[to] } : { exists: false }
  const items = [
    { id: 'home', to: '/' },
    { id: 'admin', children: [{ id: 'users', to: '/users' }, { id: 'roles', to: '/roles' }] },
    { id: 'ghost', to: '/missing' },
    { id: 'flagged', permission: 'reports.view' as Permission },
  ]
  it('uses route meta, drops empty parents and unknown routes', () => {
    const s = set('dashboard.view')
    const out = filterNavigation(items, (req, mode) => checkPermissions(s, req, mode), resolve)
    expect(out.map(i => i.id)).toEqual(['home'])
  })
  it('keeps parents with visible children', () => {
    const s = set('users.view', 'reports.view')
    const out = filterNavigation(items, (req, mode) => checkPermissions(s, req, mode), resolve)
    expect(out.map(i => i.id)).toEqual(['admin', 'flagged'])
    expect(out[0]?.children?.map(i => i.id)).toEqual(['users'])
  })
})
