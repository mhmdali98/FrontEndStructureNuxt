import type { NuxtApp } from '#app'

/** Client-only, non-reactive guard so concurrent 401s start the flow once. */
let expiring = false

export function resetSessionExpiredFlag(): void {
  expiring = false
}

/**
 * Session-expired flow: reset auth state, drop cached server data, tell other tabs,
 * then go to the login page with a return path. Runs at most once until the next login.
 */
export async function startSessionExpiredFlow(nuxtApp: NuxtApp): Promise<void> {
  if (expiring) return
  expiring = true
  await nuxtApp.runWithContext(async () => {
    const auth = useAuthStore()
    const route = useRoute()
    const { clear } = useUserSession()
    auth.$reset()
    const qc = useQueryCache()
    qc.getEntries().forEach(e => qc.remove(e))
    useAuthBroadcast().post('expired')
    // Clear the client copy of the session; the server already dropped it.
    await clear().catch(() => undefined)
    const redirect = route.meta.guestOnly ? undefined : route.fullPath
    await navigateTo({ path: '/login', query: { reason: 'session_expired', ...(redirect ? { redirect } : {}) } })
    useNotify().warning('auth.sessionExpired', { id: 'session-expired' })
  })
}
