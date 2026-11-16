import { createError, type RequestEvent } from 'nuxt/server'
import type { TokenPair } from '#layers/core/shared/types/auth'
import { backendFetch, readJsonSafe } from './backend'
import { toStoredTokens, useTokenStore, type StoredTokens } from './token-store'

/**
 * Refresh state is per process. Multi-instance deployments need `authTokenStore: 'storage'`
 * with a shared driver plus a distributed lock (documented in ARCHITECTURE.md).
 */
const inflight = new Map<string, Promise<StoredTokens>>()
const rotated = new Map<string, { tokens: StoredTokens, until: number }>()
const ROTATED_TTL_MS = 60_000

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export class SessionEndedError extends Error {
  constructor() {
    super('Session ended')
    this.name = 'SessionEndedError'
  }
}

function sweep(now: number): void {
  for (const [k, v] of rotated) if (v.until <= now) rotated.delete(k)
}

async function callRefresh(event: RequestEvent, refreshToken: string): Promise<StoredTokens> {
  let res: Response
  try {
    res = await backendFetch(event, '/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  }
  catch {
    throw createError({ status: 502, statusText: 'Bad Gateway', data: { code: 'UPSTREAM_UNAVAILABLE', message: 'Backend unavailable' } })
  }
  if (res.status === 400 || res.status === 401) throw new SessionEndedError()
  if (!res.ok) {
    throw createError({ status: 502, statusText: 'Bad Gateway', data: { code: 'UPSTREAM_UNAVAILABLE', message: 'Token refresh failed' } })
  }
  const pair = await readJsonSafe(res) as TokenPair
  const tokens = toStoredTokens(pair)
  if (!tokens.refreshToken) tokens.refreshToken = refreshToken
  return tokens
}

/**
 * Single-flight refresh that stays safe when the backend rotates refresh tokens:
 * concurrent callers share one request, and late callers with the old token reuse the
 * rotated pair for 60 s instead of refreshing (and failing) again.
 */
export async function refreshTokens(event: RequestEvent, current: StoredTokens): Promise<StoredTokens> {
  if (!current.refreshToken) throw new SessionEndedError()
  const now = Date.now()
  sweep(now)
  const key = await sha256(current.refreshToken)

  const cached = rotated.get(key)
  if (cached) {
    await useTokenStore().set(event, cached.tokens)
    return cached.tokens
  }

  let promise = inflight.get(key)
  if (!promise) {
    promise = callRefresh(event, current.refreshToken)
      .then((tokens) => {
        rotated.set(key, { tokens, until: Date.now() + ROTATED_TTL_MS })
        return tokens
      })
      .finally(() => inflight.delete(key))
    inflight.set(key, promise)
  }

  try {
    const tokens = await promise
    await useTokenStore().set(event, tokens)
    return tokens
  }
  catch (e) {
    // Another caller may have rotated the token meanwhile.
    const late = rotated.get(key)
    if (e instanceof SessionEndedError && late) {
      await useTokenStore().set(event, late.tokens)
      return late.tokens
    }
    throw e
  }
}

/** Refreshes proactively when less than min(60 s, lifetime / 2) remains. */
export async function ensureFreshToken(event: RequestEvent, tokens: StoredTokens): Promise<StoredTokens> {
  if (!tokens.refreshToken || !tokens.expiresAt) return tokens
  const threshold = Math.min(60_000, (tokens.lifetime ?? 120_000) / 2)
  if (tokens.expiresAt - Date.now() > threshold) return tokens
  return refreshTokens(event, tokens)
}

/** Test helper. */
export function _resetRefreshState(): void {
  inflight.clear()
  rotated.clear()
}
