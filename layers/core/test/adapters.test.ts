import { describe, expect, it } from 'vitest'
import { caseTransform, serializeListParams, toPaginated } from '../app/utils/api-adapters'
import { safeRedirect } from '../app/utils/safe-redirect'

describe('toPaginated', () => {
  it('accepts our shape', () => {
    expect(toPaginated({ data: [1, 2], meta: { page: 2, perPage: 2, total: 10, lastPage: 5 } }).meta).toEqual({ page: 2, perPage: 2, total: 10, lastPage: 5 })
  })
  it('accepts the Laravel paginator', () => {
    expect(toPaginated({ data: [1], current_page: 3, per_page: 15, total: 31, last_page: 3 }).meta).toEqual({ page: 3, perPage: 15, total: 31, lastPage: 3 })
  })
  it('accepts Laravel API resource collections', () => {
    expect(toPaginated({ data: [1], meta: { current_page: 1, per_page: 1, total: 1, last_page: 1 } }).meta.page).toBe(1)
  })
  it('wraps plain arrays', () => {
    expect(toPaginated([1, 2, 3]).meta.total).toBe(3)
  })
})

describe('serializeListParams', () => {
  it('flattens params', () => {
    expect(serializeListParams({ page: 2, perPage: 20, sort: '-createdAt', search: ' ali ', filter: { status: ['active', 'invited'], role: 'r1', empty: [] } })).toEqual({
      'page': '2', 'perPage': '20', 'sort': '-createdAt', 'search': 'ali', 'filter[status]': 'active,invited', 'filter[role]': 'r1',
    })
  })
  it('supports repeated keys', () => {
    expect(serializeListParams({ filter: { role: ['1', '2'] } }, { repeatedKeys: true })).toEqual({ 'filter[role][]': ['1', '2'] })
  })
})

describe('caseTransform', () => {
  it('round-trips keys', () => {
    const snake = { user_name: 'x', nested_list: [{ created_at: 1 }] }
    expect(caseTransform.toCamel(snake)).toEqual({ userName: 'x', nestedList: [{ createdAt: 1 }] })
    expect(caseTransform.toSnake(caseTransform.toCamel(snake))).toEqual(snake)
  })
})

describe('safeRedirect', () => {
  it.each([
    ['/users', '/users'],
    ['/users?x=1', '/users?x=1'],
    [['/roles'], '/roles'],
    ['//evil.com', undefined],
    ['/\\evil.com', undefined],
    ['https://evil.com', undefined],
    ['/login?x', undefined],
    ['/a\nb', undefined],
    [undefined, undefined],
  ])('%s → %s', (input, expected) => {
    expect(safeRedirect(input)).toBe(expected)
  })
})
