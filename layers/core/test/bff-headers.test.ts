import { describe, expect, it } from 'vitest'
import { pickRequestHeaders, pickResponseHeaders } from '../server/utils/bff'

describe('BFF header allow-lists', () => {
  it('never forwards browser cookies to the backend', () => {
    const h = pickRequestHeaders(new Headers({
      'cookie': 'nuxt-auth-session=secret',
      'content-type': 'application/json',
      'accept-language': 'ar',
      'x-request-id': 'r1',
      'authorization': 'Bearer from-browser',
      'x-forwarded-for': '1.2.3.4',
    }), 'server-token')
    expect(h.get('cookie')).toBeNull()
    expect(h.get('x-forwarded-for')).toBeNull()
    expect(h.get('authorization')).toBe('Bearer server-token')
    expect(h.get('accept-language')).toBe('ar')
  })
  it('never relays backend cookies to the browser', () => {
    const relayed = Object.fromEntries(pickResponseHeaders(new Headers({
      'set-cookie': 'backend=1',
      'content-type': 'application/json',
      'x-permissions-version': 'v2',
      'server': 'nginx',
    })))
    expect(relayed).toEqual({ 'content-type': 'application/json', 'x-permissions-version': 'v2' })
  })
})
