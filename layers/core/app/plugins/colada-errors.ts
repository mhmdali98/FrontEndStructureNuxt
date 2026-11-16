import { setApiErrorHandler } from '../utils/error-bus'

/**
 * Pinia Colada global hooks run outside the Nuxt context. They only forward errors to the
 * error bus; this plugin applies the error policy inside `runWithContext`.
 */
export default defineNuxtPlugin({
  name: 'core-colada-errors',
  dependsOn: ['Pinia Colada'],
  setup(nuxtApp) {
    setApiErrorHandler((error) => {
      void nuxtApp.runWithContext(() => useErrorPolicy().handleApiError(error))
    })
  },
})
