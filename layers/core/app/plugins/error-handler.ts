/** Global Vue/Nuxt error hooks: log in dev, forward to the error reporter. */
export default defineNuxtPlugin({
  name: 'core-error-handler',
  setup(nuxtApp) {
    nuxtApp.hook('vue:error', (error, _instance, info) => {
      if (import.meta.dev) console.warn('[vue:error]', info, error)
      reportAppError(error, { info })
    })
    nuxtApp.hook('app:error', (error) => {
      if (import.meta.dev) console.warn('[app:error]', error)
      reportAppError(error)
    })
  },
})
