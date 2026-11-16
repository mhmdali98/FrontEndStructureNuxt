import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { checkPermissions } from './permissions'

/** After a `/me` refetch, the current page may no longer be allowed. */
export function recheckCurrentRoute(route: RouteLocationNormalizedLoaded): void {
  if (route.meta.public || route.meta.guestOnly || !route.meta.permissions?.length) return
  const auth = useAuthStore()
  if (!checkPermissions(auth.permissionSet, route.meta.permissions, route.meta.permissionMode)) {
    showError(createError({ status: 403, statusText: 'Forbidden', fatal: true }))
  }
}
