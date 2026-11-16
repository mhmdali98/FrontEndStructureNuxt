import type { ApiClient } from '#layers/core/app/composables/useApiClient'
import type { ListParams, Paginated } from '#layers/core/shared/types/api'
import { serializeListParams, toPaginated } from '#layers/core/app/utils/api-adapters'
import type { User, UserInput, UserRoleRef } from '#layers/users/shared/types/users'

/** Pure API module: no Vue imports, easy to unit test with a fake client. */
export function createUsersApi(client: ApiClient) {
  return {
    list: async (params: ListParams, signal?: AbortSignal): Promise<Paginated<User>> =>
      toPaginated<User>(await client.get<unknown>('/users', { query: serializeListParams(params), signal })),
    get: (id: string, signal?: AbortSignal) => client.get<User>(`/users/${encodeURIComponent(id)}`, { signal }),
    create: (input: UserInput) => client.post<User>('/users', input),
    update: (id: string, input: Partial<UserInput>) => client.patch<User>(`/users/${encodeURIComponent(id)}`, input),
    remove: (id: string) => client.delete<null>(`/users/${encodeURIComponent(id)}`),
    bulkRemove: (ids: string[]) => client.post<null>('/users/bulk-delete', { ids }),
    /** Role options come from a users-scoped endpoint, never from the roles layer. */
    roleOptions: (signal?: AbortSignal) => client.get<UserRoleRef[]>('/roles/options', { signal }),
  }
}

export type UsersApi = ReturnType<typeof createUsersApi>
