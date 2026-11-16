import type { AuthUser, MeResponse } from '#layers/core/shared/types/auth'
import { normalizePermissions } from '../utils/permissions'

/**
 * The only source of user data for the UI. Never holds tokens: those live in the
 * sealed, httpOnly session cookie and are only readable by the server (BFF).
 */
export const useAuthStore = defineStore('core-auth', () => {
  const user = ref<AuthUser | null>(null)
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])
  const permissionsVersion = ref<string | undefined>()
  const preferences = ref<MeResponse['preferences']>()
  const loadedAt = ref<number | null>(null)

  const permissionSet = computed<ReadonlySet<string>>(() => new Set(permissions.value))
  const isLoaded = computed(() => loadedAt.value !== null)

  let inflight: Promise<MeResponse> | null = null

  function apply(me: MeResponse): void {
    user.value = me.user
    roles.value = me.roles
    permissions.value = normalizePermissions(me.permissions)
    permissionsVersion.value = me.permissionsVersion
    preferences.value = me.preferences
    loadedAt.value = Date.now()
  }

  async function load(options: { silent?: boolean } = {}): Promise<MeResponse> {
    if (inflight) return inflight
    const client = useApiClient()
    inflight = client.get<MeResponse>('/auth/me', { silent: options.silent })
      .then((me) => {
        apply(me)
        return me
      })
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  async function ensureLoaded(): Promise<void> {
    if (!isLoaded.value) await load()
  }

  function setUser(next: Partial<AuthUser>): void {
    if (user.value) user.value = { ...user.value, ...next }
  }

  function $reset(): void {
    user.value = null
    roles.value = []
    permissions.value = []
    permissionsVersion.value = undefined
    preferences.value = undefined
    loadedAt.value = null
  }

  return {
    user, roles, permissions, permissionsVersion, preferences, loadedAt,
    permissionSet, isLoaded,
    load, ensureLoaded, setUser, apply, $reset,
  }
})
