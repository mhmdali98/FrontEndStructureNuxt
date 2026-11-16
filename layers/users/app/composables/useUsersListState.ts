import type { LocationQuery } from 'vue-router'
import type { ListParams } from '#layers/core/shared/types/api'
import { USER_STATUSES, type UserStatus, type UsersListState } from '#layers/users/shared/types/users'

export const USERS_PER_PAGE: readonly number[] = [10, 20, 50]
const DEFAULTS: UsersListState = { page: 1, perPage: 10, sort: '-createdAt', search: '', status: [], roles: [] }

const list = (v: unknown): string[] => (Array.isArray(v) ? v.join(',') : String(v ?? '')).split(',').filter(Boolean)

/** Pure: URL query → list state (defensive against junk values). */
export function parseUsersQuery(q: LocationQuery): UsersListState {
  const page = Math.max(1, Number(q.page) || 1)
  const perPage = USERS_PER_PAGE.includes(Number(q.perPage)) ? Number(q.perPage) : DEFAULTS.perPage
  return {
    page,
    perPage,
    sort: typeof q.sort === 'string' && /^-?[a-zA-Z]+$/.test(q.sort) ? q.sort : DEFAULTS.sort,
    search: typeof q.search === 'string' ? q.search : '',
    status: list(q.status).filter((s): s is UserStatus => (USER_STATUSES as readonly string[]).includes(s)),
    roles: list(q.roles),
  }
}

/** Pure: list state → URL query (defaults omitted to keep URLs short). */
export function toUsersQuery(s: UsersListState): Record<string, string> {
  const q: Record<string, string> = {}
  if (s.page !== DEFAULTS.page) q.page = String(s.page)
  if (s.perPage !== DEFAULTS.perPage) q.perPage = String(s.perPage)
  if (s.sort !== DEFAULTS.sort) q.sort = s.sort
  if (s.search) q.search = s.search
  if (s.status.length) q.status = s.status.join(',')
  if (s.roles.length) q.roles = s.roles.join(',')
  return q
}

export function toListParams(s: UsersListState): ListParams {
  return {
    page: s.page,
    perPage: s.perPage,
    sort: s.sort,
    search: s.search || undefined,
    filter: { status: s.status, role: s.roles },
  }
}

/** Two-way URL-synced list state (`replace: true`, so Back leaves the page). */
export function useUsersListState() {
  const route = useRoute()
  const router = useRouter()
  const state = computed(() => parseUsersQuery(route.query))

  function update(patch: Partial<UsersListState>): void {
    const resetPage = Object.keys(patch).some(k => k !== 'page')
    const next = { ...state.value, ...patch, ...(resetPage && patch.page === undefined ? { page: 1 } : {}) }
    const extra = Object.fromEntries(Object.entries(route.query).filter(([k]) => k === 'create'))
    void router.replace({ query: { ...toUsersQuery(next), ...extra } as Record<string, string> })
  }

  const params = computed(() => toListParams(state.value))
  return { state, update, params }
}
