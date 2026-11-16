import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = { tokens: null as null | Record<string, unknown>, set: vi.fn(), get: vi.fn(), clear: vi.fn() }
const backend = { calls: 0, rotate: 0, mode: 'ok' as 'ok' | 'unauthorized' | 'down' }

vi.mock('../server/utils/token-store', () => ({
  useTokenStore: () => ({
    get: async () => store.tokens,
    set: async (_e: unknown, t: Record<string, unknown>) => {
      store.tokens = t
      store.set(t)
    },
    clear: async () => {
      store.tokens = null
    },
  }),
  toStoredTokens: (pair: { accessToken: string, refreshToken?: string, expiresIn?: number }) => ({
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    lifetime: pair.expiresIn ? pair.expiresIn * 1000 : undefined,
    expiresAt: pair.expiresIn ? Date.now() + pair.expiresIn * 1000 : undefined,
  }),
}))

vi.mock('../server/utils/backend', () => ({
  backendFetch: async () => {
    backend.calls++
    await new Promise(r => setTimeout(r, 20))
    if (backend.mode === 'down') throw new TypeError('fetch failed')
    if (backend.mode === 'unauthorized') return new Response('{}', { status: 401 })
    backend.rotate++
    return new Response(JSON.stringify({ accessToken: `at${backend.rotate}`, refreshToken: `rt${backend.rotate}`, expiresIn: 120 }), { status: 200 })
  },
  readJsonSafe: async (r: Response) => JSON.parse(await r.text()),
}))

const { refreshTokens, ensureFreshToken, SessionEndedError, _resetRefreshState } = await import('../server/utils/refresh')

const event = {} as never
const expiring = () => ({ accessToken: 'at0', refreshToken: 'rt0', lifetime: 120_000, expiresAt: Date.now() + 1000 })

describe('token refresh', () => {
  beforeEach(() => {
    _resetRefreshState()
    backend.calls = 0
    backend.rotate = 0
    backend.mode = 'ok'
    store.tokens = null
  })

  it('does nothing while the token is fresh', async () => {
    const fresh = { ...expiring(), expiresAt: Date.now() + 100_000 }
    expect(await ensureFreshToken(event, fresh)).toBe(fresh)
    expect(backend.calls).toBe(0)
  })

  it('skips proactive refresh without a refresh token', async () => {
    const t = { accessToken: 'x' }
    expect(await ensureFreshToken(event, t)).toBe(t)
  })

  it('5 parallel callers trigger exactly one backend refresh', async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => ensureFreshToken(event, expiring())))
    expect(backend.calls).toBe(1)
    expect(new Set(results.map(r => r.accessToken))).toEqual(new Set(['at1']))
  })

  it('a late caller with the old (rotated) token reuses the new pair without refreshing or logging out', async () => {
    await ensureFreshToken(event, expiring())
    backend.mode = 'unauthorized' // the backend would now reject rt0
    const late = await ensureFreshToken(event, expiring())
    expect(late.accessToken).toBe('at1')
    expect(backend.calls).toBe(1)
  })

  it('ends the session only on a backend 401 with no cached rotation', async () => {
    backend.mode = 'unauthorized'
    await expect(refreshTokens(event, expiring())).rejects.toBeInstanceOf(SessionEndedError)
  })

  it('keeps the session when the backend is down (502 UPSTREAM_UNAVAILABLE)', async () => {
    backend.mode = 'down'
    await expect(refreshTokens(event, expiring())).rejects.toMatchObject({ status: 502 })
  })
})
