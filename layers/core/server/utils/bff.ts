/** Request headers the BFF forwards to the backend. Everything else (cookies!) is dropped. */
export const FORWARD_REQUEST_HEADERS = ['content-type', 'accept', 'accept-language', 'x-request-id'] as const

/** Response headers the BFF relays to the browser. `set-cookie` is never relayed. */
export const RELAY_RESPONSE_HEADERS = ['content-type', 'content-disposition', 'cache-control', 'retry-after', 'x-permissions-version'] as const

export function pickRequestHeaders(source: Headers, accessToken?: string): Headers {
  const out = new Headers()
  for (const name of FORWARD_REQUEST_HEADERS) {
    const v = source.get(name)
    if (v !== null) out.set(name, v)
  }
  if (accessToken) out.set('authorization', `Bearer ${accessToken}`)
  return out
}

export function pickResponseHeaders(source: Headers): [string, string][] {
  const out: [string, string][] = []
  for (const name of RELAY_RESPONSE_HEADERS) {
    const v = source.get(name)
    if (v !== null) out.push([name, v])
  }
  return out
}
