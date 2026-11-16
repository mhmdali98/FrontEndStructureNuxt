import { createError, defineEventHandler, getRequestURL, useRuntimeConfig } from 'nuxt/server'

/** Mock routes exist only when `mockRoutes` or `apiMock` is enabled. */
export default defineEventHandler((event) => {
  if (!getRequestURL(event).pathname.startsWith('/api/mock')) return
  const config = useRuntimeConfig()
  const enabled = String(config.mockRoutes) === 'true' || String(config.apiMock) === 'true'
  if (!enabled) throw createError({ status: 404, statusText: 'Not Found' })
})
