import { checkPermissions } from '../utils/permissions'

/** Route-level RBAC from `definePageMeta({ permissions, permissionMode })`. */
export default defineNuxtRouteMiddleware((to) => {
  if (to.meta.public || to.meta.guestOnly) return
  if (!to.meta.permissions?.length) return
  const auth = useAuthStore()
  if (!auth.isLoaded) return
  if (!checkPermissions(auth.permissionSet, to.meta.permissions, to.meta.permissionMode)) {
    return abortNavigation(createError({ status: 403, statusText: 'Forbidden', fatal: true }))
  }
})
