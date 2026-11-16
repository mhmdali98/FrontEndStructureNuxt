/**
 * Authentication guard. Public pages pass, guest-only pages bounce logged-in users,
 * everything else requires a session and loads `/me` once per session.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.meta.public) return

  const { loggedIn, fetch: fetchSession, ready } = useUserSession()
  if (!ready.value) await fetchSession()

  const auth = useAuthStore()

  if (to.meta.guestOnly) {
    if (!loggedIn.value) return
    await auth.ensureLoaded().catch(() => undefined)
    return navigateTo(useHomeRoute().resolve(to.query.redirect))
  }

  if (!loggedIn.value) {
    if (to.path === '/login') return
    return navigateTo({ path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} })
  }

  try {
    await auth.ensureLoaded()
  }
  catch {
    // The session-expired flow (or the error policy) has already taken over.
    return abortNavigation()
  }
})
