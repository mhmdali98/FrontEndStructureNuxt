import type { ApiClient } from '#layers/core/app/composables/useApiClient'
import type { PermissionDef, Role, RoleInput } from '#layers/roles/shared/types/roles'

export function createRolesApi(client: ApiClient) {
  return {
    list: (signal?: AbortSignal) => client.get<Role[]>('/roles', { signal }),
    permissions: (signal?: AbortSignal) => client.get<PermissionDef[]>('/permissions', { signal }),
    create: (input: RoleInput) => client.post<Role>('/roles', input),
    update: (id: string, input: Partial<RoleInput>) => client.patch<Role>(`/roles/${encodeURIComponent(id)}`, input),
    remove: (id: string) => client.delete<null>(`/roles/${encodeURIComponent(id)}`),
  }
}
