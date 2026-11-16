import { createError, defineEventHandler, getRequestHeader, getRequestURL } from 'nuxt/server'

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const ALLOWED_TYPES = ['application/json', 'multipart/form-data']

/**
 * CSRF defence for every state-changing `/api/**` call (including login):
 * custom header + content-type allow-list + same-origin check.
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/api/_auth/') || url.pathname.startsWith('/api/mock/')) return
  if (!UNSAFE.has(event.req.method.toUpperCase())) return

  const forbidden = (reason: string) => createError({
    status: 403,
    statusText: 'Forbidden',
    data: { code: 'CSRF', message: reason },
  })

  if (getRequestHeader(event, 'x-requested-with') !== 'fetch') throw forbidden('Missing X-Requested-With header')

  const type = (getRequestHeader(event, 'content-type') ?? '').split(';')[0]!.trim().toLowerCase()
  const hasBody = Number(getRequestHeader(event, 'content-length') ?? '0') > 0 || type !== ''
  if (hasBody && !ALLOWED_TYPES.includes(type)) throw forbidden('Unsupported content type')

  const origin = getRequestHeader(event, 'origin')
  if (origin && origin !== url.origin) {
    const host = getRequestHeader(event, 'x-forwarded-host') ?? getRequestHeader(event, 'host')
    if (!host || new URL(origin).host !== host) throw forbidden('Cross-origin request')
  }
})
