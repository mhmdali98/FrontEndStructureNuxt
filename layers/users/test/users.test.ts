import { describe, expect, it, vi } from 'vitest'
import { buildUsersRowActions, hasManageActions } from '../app/composables/useUsersRowActions'
import { parseUsersQuery, toListParams, toUsersQuery } from '../app/composables/useUsersListState'
import { createUserSchema } from '../app/schemas/users.schema'
import { usersToCsv } from '../app/composables/useUsersExport'
import { createUsersApi } from '../app/api/users.api'
import type { User } from '../shared/types/users'

const t = (k: string) => k
const user: User = {
  id: 'u-9', name: 'Ali', email: 'ali@x.io', avatarUrl: null, phone: null, locale: 'ar',
  createdAt: '2026-01-01', status: 'active', roles: [{ id: 'r1', name: 'viewer', label: 'Viewer' }], lastLoginAt: null,
}

describe('users row actions', () => {
  const base = { currentUserId: 'u-1', t, onEdit: vi.fn(), onDelete: vi.fn(), onView: vi.fn() }
  it('viewer gets view only', () => {
    const items = buildUsersRowActions(user, { ...base, can: () => false })
    expect(items.map(i => i.label)).toEqual(['users.actions.view'])
    expect(hasManageActions(() => false)).toBe(false)
  })
  it('manager gets view + edit', () => {
    const items = buildUsersRowActions(user, { ...base, can: p => p === 'users.update' })
    expect(items.map(i => i.label)).toEqual(['users.actions.view', 'common.edit'])
  })
  it('admin gets delete; self-delete is visible but disabled', () => {
    expect(buildUsersRowActions(user, { ...base, can: () => true }).at(-1)).toMatchObject({ label: 'common.delete', disabled: false })
    expect(buildUsersRowActions(user, { ...base, currentUserId: 'u-9', can: () => true }).at(-1)).toMatchObject({ label: 'users.actions.cannotDeleteSelf', disabled: true })
  })
})

describe('users list state ↔ URL', () => {
  it('parses defensively', () => {
    expect(parseUsersQuery({ page: '-3', perPage: '999', sort: 'name;drop', status: 'active,bogus', roles: 'r1,r2' })).toEqual({
      page: 1, perPage: 10, sort: '-createdAt', search: '', status: ['active'], roles: ['r1', 'r2'],
    })
  })
  it('round-trips and omits defaults', () => {
    const s = { page: 3, perPage: 20, sort: 'name', search: 'ali', status: ['invited' as const], roles: [] }
    expect(toUsersQuery(s)).toEqual({ page: '3', perPage: '20', sort: 'name', search: 'ali', status: 'invited' })
    expect(parseUsersQuery(toUsersQuery(s))).toEqual(s)
    expect(toUsersQuery(parseUsersQuery({}))).toEqual({})
  })
  it('maps to list params', () => {
    expect(toListParams(parseUsersQuery({ status: 'active' })).filter).toEqual({ status: ['active'], role: [] })
  })
})

describe('users schema', () => {
  it('requires a password on create only', () => {
    const v = { name: 'Al', email: 'a@b.co', phone: '', roleIds: ['r1'], status: 'active' }
    expect(createUserSchema(t, 'create').safeParse(v).success).toBe(false)
    expect(createUserSchema(t, 'edit').safeParse(v).success).toBe(true)
  })
  it('uses translated messages', () => {
    const r = createUserSchema(t, 'edit').safeParse({ name: 'A', email: 'bad', roleIds: [], status: 'active' })
    expect(r.success).toBe(false)
    const msgs = r.error!.issues.map(i => i.message)
    expect(msgs).toEqual(expect.arrayContaining(['validation.min', 'validation.email', 'validation.atLeastOne']))
  })
})

describe('users CSV export', () => {
  it('escapes and prefixes a BOM for Excel', () => {
    const csv = usersToCsv([{ ...user, name: 'Ali, "The" Admin' }], { name: 'Name', email: 'Email', roles: 'Roles', status: 'Status', createdAt: 'Created' })
    expect(csv.charCodeAt(0)).toBe(0xFEFF)
    expect(csv).toContain('"Ali, ""The"" Admin",ali@x.io,Viewer,active,2026-01-01')
  })
})

describe('users api', () => {
  it('serializes list params and normalizes the response', async () => {
    const get = vi.fn(async () => ({ data: [user], current_page: 1, per_page: 10, total: 1, last_page: 1 }))
    const api = createUsersApi({ get } as never)
    const res = await api.list({ page: 1, perPage: 10, filter: { status: ['active', 'invited'] } })
    expect(get).toHaveBeenCalledWith('/users', expect.objectContaining({ query: { 'page': '1', 'perPage': '10', 'filter[status]': 'active,invited' } }))
    expect(res.meta.total).toBe(1)
  })
})
