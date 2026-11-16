import type { Permission, PermissionMode } from '#layers/core/shared/types/permissions'
import { checkPermissions, matchPermission } from '../utils/permissions'

/**
 * Reactive permission checks backed by the auth store. UI gating is UX only:
 * the backend always enforces access.
 */
export function usePermissions() {
  const auth = useAuthStore()

  const can = (permission: Permission): boolean => matchPermission(auth.permissionSet, permission)
  const canAny = (permissions: readonly Permission[]): boolean => checkPermissions(auth.permissionSet, permissions, 'any')
  const canAll = (permissions: readonly Permission[]): boolean => checkPermissions(auth.permissionSet, permissions, 'all')
  const check = (required: Permission | readonly Permission[] | undefined, mode: PermissionMode = 'all'): boolean =>
    checkPermissions(auth.permissionSet, required, mode)
  const hasRole = (role: string): boolean => auth.roles.includes(role)
  const hasAnyRole = (roles: readonly string[]): boolean => roles.some(r => auth.roles.includes(r))

  return { can, canAny, canAll, check, hasRole, hasAnyRole }
}
