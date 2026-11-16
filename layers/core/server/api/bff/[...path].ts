import { createError, defineEventHandler, getRequestURL, setResponseStatus, type RequestEvent } from 'nuxt/server'
import { backendFetch } from '../../utils/backend'
import { pickRequestHeaders, pickResponseHeaders } from '../../utils/bff'
import { ensureFreshToken, refreshTokens, SessionEndedError } from '../../utils/refresh'
import { useTokenStore, type StoredTokens } from '../../utils/token-store'

function sessionExpired(): Error {
  return createError({ status: 401, statusText: 'Unauthorized', data: { code: 'SESSION_EXPIRED', message: 'Session expired' } })
}

async function endSession(event: RequestEvent): Promise<never> {
  await useTokenStore().clear(event)
  throw sessionExpired()
}

/**
 * Authenticated proxy to the backend. Uses an allow-list of headers in both directions,
 * so browser cookies never reach the backend and backend cookies never reach the browser.
 * The body is buffered once so the request can be replayed after a refresh.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw sessionExpired()

  const store = useTokenStore()
  let tokens: StoredTokens | null = await store.get(event)
  if (!tokens) return endSession(event)

  try {
    tokens = await ensureFreshToken(event, tokens)
  }
  catch (e) {
    if (e instanceof SessionEndedError) return endSession(event)
    throw e
  }

  const url = getRequestURL(event)
  const path = url.pathname.replace(/^\/api\/bff/, '') || '/'
  const method = event.req.method.toUpperCase()
  const body = method === 'GET' || method === 'HEAD' ? undefined : await event.req.arrayBuffer()

  const send = (accessToken: string) => backendFetch(event, path, {
    method,
    query: url.search,
    headers: pickRequestHeaders(event.req.headers, accessToken),
    body: body && body.byteLength > 0 ? body : undefined,
  })

  let res: Response
  try {
    res = await send(tokens.accessToken)
    if (res.status === 401) {
      try {
        tokens = await refreshTokens(event, tokens)
      }
      catch (e) {
        if (e instanceof SessionEndedError) return endSession(event)
        throw e
      }
      res = await send(tokens.accessToken)
      if (res.status === 401) return endSession(event)
    }
  }
  catch (e) {
    if ((e as { status?: number }).status) throw e
    throw createError({ status: 502, statusText: 'Bad Gateway', data: { code: 'UPSTREAM_UNAVAILABLE', message: 'Backend unavailable' } })
  }

  // Buffered relay (see DECISIONS.md: streaming a returned Response is not relied upon on Nitro 2).
  setResponseStatus(event, res.status)
  for (const [name, value] of pickResponseHeaders(res.headers)) event.res.headers.set(name, value)
  if (res.status === 204 || res.status === 304) return null
  const type = res.headers.get('content-type') ?? ''
  if (type.includes('application/json')) {
    const text = await res.text()
    return text ? JSON.parse(text) as unknown : null
  }
  return new Uint8Array(await res.arrayBuffer())
})
