/**
 * Keeps the session coherent across tabs and keeps permissions fresh:
 * - another tab logged out / expired → this tab goes to login
 * - another tab logged in → this tab reloads
 * - window focus after 5 minutes → refetch /me and re-check the current route
 */
export default defineNuxtPlugin({
  name: 'core-auth-sync',
  dependsOn: ['pinia', 'i18n:plugin'],
  setup(nuxtApp) {
    const auth = useAuthStore()
    const { event: remote } = useAuthBroadcast()
    const { loggedIn, clear } = useUserSession()
    const router = useRouter()

    watch(remote, async (event) => {
      if (event === 'logout' || event === 'expired') {
        auth.$reset()
        await clear().catch(() => undefined)
        reloadNuxtApp({ path: '/login', force: true })
      }
      else if (event === 'login' && !loggedIn.value) {
        reloadNuxtApp({ path: '/', force: true })
      }
    })

    // Re-check the current route whenever permissions change (refetch after 403, focus, version).
    watch(() => auth.permissionSet, () => {
      if (!auth.isLoaded) return
      void nuxtApp.runWithContext(() => recheckCurrentRoute(router.currentRoute.value))
    })

    // Persist the chosen language on the account (silent PATCH /profile).
    const { locale } = useNuxtApp().$i18n
    watch(locale, (next) => {
      if (!loggedIn.value || !auth.user || auth.user.locale === next) return
      auth.setUser({ locale: next as 'en' | 'ar' })
      void useApiClient().patch('/profile', { locale: next }, { silent: true }).catch(() => undefined)
    })

    const focused = useWindowFocus()
    watch(focused, (isFocused) => {
      if (!isFocused || !loggedIn.value || !auth.loadedAt) return
      if (Date.now() - auth.loadedAt > 5 * 60 * 1000) void auth.load({ silent: true }).catch(() => undefined)
    })
  },
})
