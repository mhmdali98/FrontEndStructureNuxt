import { serverFetch, useRuntimeConfig, type RequestEvent } from 'nuxt/server'

export interface BackendInit {
  method?: string
  headers?: Headers | Record<string, string>
  body?: BodyInit | null
  query?: string
  timeout?: number
}

/**
 * One way to reach the backend. Real mode calls `apiBase` over HTTP; mock mode calls the
 * in-process mock (`/api/mock`) with the same paths. Never forwards browser cookies.
 */
export async function backendFetch(event: RequestEvent, path: string, init: BackendInit = {}): Promise<Response> {
  const config = useRuntimeConfig()
  const timeout = init.timeout ?? Number(config.apiTimeout)
  const qs = init.query ? (init.query.startsWith('?') ? init.query : `?${init.query}`) : ''
  const requestInit: RequestInit = {
    method: init.method ?? 'GET',
    headers: init.headers,
    body: init.body ?? undefined,
    signal: AbortSignal.timeout(timeout),
  }
  if (String(config.apiMock) === 'true') {
    return serverFetch(event, `/api/mock${path}${qs}`, { ...requestInit, forwardHeaders: false })
  }
  const base = String(config.apiBase).replace(/\/$/, '')
  return fetch(`${base}${path}${qs}`, requestInit)
}

/** Reads a JSON body without throwing on empty/invalid bodies. */
export async function readJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  }
  catch {
    return { message: text.slice(0, 500) }
  }
}
