import type { RoleInput } from '#layers/roles/shared/types/roles'
import { createRolesApi } from '../api/roles.api'

export const rolesKeys = {
  all: ['roles'] as const,
  list: ['roles', 'list'] as const,
  permissions: ['roles', 'permissions'] as const,
}

export function useRolesQueries() {
  const api = createRolesApi(useApiClient())
  const roles = useQuery({ key: rolesKeys.list, query: ({ signal }) => api.list(signal) })
  const permissions = useQuery({ key: rolesKeys.permissions, query: ({ signal }) => api.permissions(signal), staleTime: 10 * 60_000 })
  return { roles, permissions }
}

export function useRolesMutations() {
  const api = createRolesApi(useApiClient())
  const cache = useQueryCache()
  const auth = useAuthStore()
  const after = async (roleName?: string) => {
    await cache.invalidateQueries({ key: rolesKeys.all })
    // Editing a role the current user holds changes their own permissions.
    if (!roleName || auth.roles.includes(roleName)) await auth.load({ silent: true }).catch(() => undefined)
  }
  const create = useMutation({ mutation: (input: RoleInput) => api.create(input), onSettled: () => after('') })
  const update = useMutation({
    mutation: ({ id, input }: { id: string, input: Partial<RoleInput> }) => api.update(id, input),
    onSettled: data => after(data?.name),
  })
  const remove = useMutation({ mutation: (id: string) => api.remove(id), onSettled: () => after('') })
  return { create, update, remove }
}
