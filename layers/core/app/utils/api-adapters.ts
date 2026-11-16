import type { ListParams, Paginated } from '#layers/core/shared/types/api'

type Dict = Record<string, unknown>

function isObject(v: unknown): v is Dict {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function n(v: unknown, fallback: number): number {
  const x = typeof v === 'string' ? Number(v) : v
  return typeof x === 'number' && Number.isFinite(x) ? x : fallback
}

/**
 * Accepts our `{ data, meta }` shape and the Laravel paginator shapes
 * (`LengthAwarePaginator` JSON and API Resource collections).
 */
export function toPaginated<T>(raw: unknown): Paginated<T> {
  if (!isObject(raw) || !Array.isArray(raw.data)) {
    const list = Array.isArray(raw) ? raw as T[] : []
    return { data: list, meta: { page: 1, perPage: list.length, total: list.length, lastPage: 1 } }
  }
  const data = raw.data as T[]
  const meta = isObject(raw.meta) ? raw.meta : raw
  const page = n(meta.page ?? meta.current_page ?? meta.currentPage, 1)
  const perPage = n(meta.perPage ?? meta.per_page, data.length || 1)
  const total = n(meta.total, data.length)
  const lastPage = n(meta.lastPage ?? meta.last_page, Math.max(1, Math.ceil(total / Math.max(perPage, 1))))
  return { data, meta: { page, perPage, total, lastPage } }
}

export interface SerializeOptions {
  /** `filter[role][]=1&filter[role][]=2` instead of `filter[role]=1,2` */
  repeatedKeys?: boolean
}

export type FlatQuery = Record<string, string | string[]>

/** Flattens list params into a query the backend understands. Never pass nested objects to ofetch. */
export function serializeListParams(params: ListParams, options: SerializeOptions = {}): FlatQuery {
  const q: FlatQuery = {}
  if (params.page !== undefined) q.page = String(params.page)
  if (params.perPage !== undefined) q.perPage = String(params.perPage)
  if (params.sort) q.sort = params.sort
  if (params.search && params.search.trim()) q.search = params.search.trim()
  for (const [key, value] of Object.entries(params.filter ?? {})) {
    const values = (Array.isArray(value) ? value : [value]).filter(v => v !== '' && v !== undefined)
    if (values.length === 0) continue
    if (options.repeatedKeys && values.length > 1) q[`filter[${key}][]`] = values
    else q[`filter[${key}]`] = values.join(',')
  }
  return q
}

const toCamel = (s: string): string => s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
const toSnake = (s: string): string => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)

function transformKeys(value: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map(v => transformKeys(v, fn))
  if (isObject(value) && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [fn(k), transformKeys(v, fn)]))
  }
  return value
}

/** Optional snake_case ↔ camelCase transform, enabled with a single flag in the API plugin. */
export const caseTransform = {
  toCamel: (v: unknown): unknown => transformKeys(v, toCamel),
  toSnake: (v: unknown): unknown => transformKeys(v, toSnake),
}
