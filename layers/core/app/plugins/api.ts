/**
 * Provides `$api`: a `$fetch` instance pointed at the BFF. Tokens never pass through here;
 * the BFF attaches them server-side from the sealed session.
 */
export default defineNuxtPlugin({
  name: 'core-api',
  setup(nuxtApp) {
    let counter = 0

    const api = $fetch.create({
      baseURL: '/api/bff',
      retry: 0,
      timeout: 30_000,
      onRequest({ options }) {
        const headers = new Headers(options.headers)
        const locale = (nuxtApp.$i18n as { locale: { value: string } } | undefined)?.locale.value ?? 'en'
        headers.set('Accept-Language', locale)
        headers.set('X-Requested-With', 'fetch')
        headers.set('X-Request-Id', `${Date.now().toString(36)}-${(counter++).toString(36)}`)
        options.headers = headers
      },
      onResponse({ response }) {
        const version = response.headers.get('x-permissions-version')
        if (!version) return
        void nuxtApp.runWithContext(() => {
          const auth = useAuthStore()
          if (auth.isLoaded && auth.permissionsVersion && auth.permissionsVersion !== version) {
            void auth.load({ silent: true }).catch(() => undefined)
          }
        })
      },
    })

    return { provide: { api } }
  },
})
