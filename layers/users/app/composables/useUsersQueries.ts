import type { Ref } from 'vue'
import type { ListParams, Paginated } from '#layers/core/shared/types/api'
import type { User, UserInput } from '#layers/users/shared/types/users'
import { createUsersApi } from '../api/users.api'

export const usersKeys = {
  all: ['users'] as const,
  list: (params: ListParams) => ['users', 'list', params as Record<string, unknown>] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
  roleOptions: ['users', 'role-options'] as const,
}

export function useUsersApi() {
  return createUsersApi(useApiClient())
}

export function useUsersListQuery(params: Ref<ListParams>) {
  const api = useUsersApi()
  return useQuery({
    key: () => usersKeys.list(params.value),
    query: ({ signal }) => api.list(params.value, signal),
    placeholderData: prev => prev,
  })
}

export function useUsersDetailQuery(id: Ref<string>) {
  const api = useUsersApi()
  return useQuery({
    key: () => usersKeys.detail(id.value),
    query: ({ signal }) => api.get(id.value, signal),
    meta: { silentError: true },
  })
}

export function useUsersRoleOptions() {
  const api = useUsersApi()
  return useQuery({
    key: usersKeys.roleOptions,
    query: ({ signal }) => api.roleOptions(signal),
    staleTime: 5 * 60_000,
  })
}

export function useUsersMutations() {
  const api = useUsersApi()
  const cache = useQueryCache()
  const invalidate = () => cache.invalidateQueries({ key: usersKeys.all })

  const create = useMutation({
    mutation: (input: UserInput) => api.create(input),
    onSettled: invalidate,
  })
  const update = useMutation({
    mutation: ({ id, input }: { id: string, input: Partial<UserInput> }) => api.update(id, input),
    onSettled: invalidate,
  })
  const remove = useMutation({
    /** Optimistic: drop the row from every cached list page, restore on failure. */
    onMutate: (id: string) => {
      const snapshots = cache.getEntries({ key: ['users', 'list'] }).map(entry => ({ key: entry.key, data: entry.state.value.data as Paginated<User> | undefined }))
      for (const s of snapshots) {
        if (s.data) cache.setQueryData(s.key, { ...s.data, data: s.data.data.filter(u => u.id !== id), meta: { ...s.data.meta, total: s.data.meta.total - 1 } })
      }
      return { snapshots }
    },
    mutation: (id: string) => api.remove(id),
    onError: (_e, _id, ctx) => {
      for (const s of ctx.snapshots ?? []) if (s.data) cache.setQueryData(s.key, s.data)
    },
    onSettled: invalidate,
  })
  const bulkRemove = useMutation({
    mutation: (ids: string[]) => api.bulkRemove(ids),
    onSettled: invalidate,
  })

  return { create, update, remove, bulkRemove }
}
