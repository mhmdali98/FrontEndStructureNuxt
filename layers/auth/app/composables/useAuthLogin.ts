import { ApiError } from '#layers/core/app/utils/api-error'
import { createAuthApi } from '../api/auth.api'

/** Login flow: BFF login → session → /me → locale/preferences → home route. */
export function useAuthLogin() {
  const api = createAuthApi(useApiClient())
  const { fetch: fetchSession } = useUserSession()
  const auth = useAuthStore()
  const appearance = useAppearanceStore()
  const config = useRuntimeConfig()
  const { setLocale } = useI18n()
  const route = useRoute()
  const { resolve } = useHomeRoute()

  const inlineError = ref<{ kind: 'credentials' | 'throttle' | 'network', seconds?: number } | null>(null)

  const { mutateAsync, isLoading } = useMutation({
    mutation: (body: { email: string, password: string, remember: boolean }) => api.login(body),
    // Failures are shown inline on the form, never as global toasts.
    meta: { silentError: true },
  })

  async function login(body: { email: string, password: string, remember: boolean }): Promise<ApiError | null> {
    inlineError.value = null
    try {
      await mutateAsync(body)
    }
    catch (e) {
      const err = e instanceof ApiError ? e : new ApiError({ status: 0, message: String(e) })
      if (err.status === 401) inlineError.value = { kind: 'credentials' }
      else if (err.status === 429) inlineError.value = { kind: 'throttle', seconds: err.retryAfter ?? 60 }
      else if (err.status !== 422) inlineError.value = { kind: 'network' }
      return err
    }
    await fetchSession()
    const me = await auth.load()
    if (me.user.locale && me.user.locale !== appearance.language) await setLocale(me.user.locale)
    if (config.public.preferencesSync && me.preferences?.appearance) appearance.update(me.preferences.appearance)
    resetSessionExpiredFlag()
    useAuthBroadcast().post('login')
    await navigateTo(resolve(route.query.redirect))
    return null
  }

  return { login, isLoading, inlineError }
}
