import { createError, setResponseStatus, type RequestEvent } from 'nuxt/server'
import { backendFetch, readJsonSafe } from './backend'

/** Public (unauthenticated) JSON pass-through to the backend. */
export async function publicPassThrough(event: RequestEvent, path: string, method = 'POST'): Promise<unknown> {
  const body = method === 'GET' ? undefined : await event.req.text()
  const res = await backendFetch(event, path, {
    method,
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      'accept-language': event.req.headers.get('accept-language') ?? 'en',
    },
    body: body || undefined,
  }).catch(() => {
    throw createError({ status: 502, statusText: 'Bad Gateway', data: { code: 'UPSTREAM_UNAVAILABLE', message: 'Backend unavailable' } })
  })
  setResponseStatus(event, res.status)
  const retryAfter = res.headers.get('retry-after')
  if (retryAfter) event.res.headers.set('retry-after', retryAfter)
  if (res.status === 204) return null
  return readJsonSafe(res)
}
