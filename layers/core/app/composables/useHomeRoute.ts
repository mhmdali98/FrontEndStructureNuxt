import { safeRedirect } from '../utils/safe-redirect'
import { checkPermissions } from '../utils/permissions'

/**
 * Where to send a user after login (or away from guest pages):
 * the safe redirect if permitted → first visible navigation item → /no-access.
 */
export function useHomeRoute() {
  const router = useRouter()
  const auth = useAuthStore()
  const { flat } = useNavigation()

  function allowed(path: string): boolean {
    const resolved = router.resolve(path)
    if (resolved.matched.length === 0 || resolved.name === undefined) return false
    if (resolved.meta.public) return true
    return checkPermissions(auth.permissionSet, resolved.meta.permissions, resolved.meta.permissionMode)
  }

  function resolve(redirect?: unknown): string {
    // Accounts without a single permission always land on the explanation page.
    if (auth.isLoaded && auth.permissions.length === 0) return '/no-access'
    const target = safeRedirect(redirect)
    if (target && allowed(target)) return target
    if (allowed('/')) return '/'
    const first = flat.value.find(item => item.to)
    return first?.to ?? '/no-access'
  }

  return { resolve }
}
