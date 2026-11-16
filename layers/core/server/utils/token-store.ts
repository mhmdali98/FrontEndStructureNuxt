import { useRuntimeConfig, type RequestEvent } from 'nuxt/server'
import type { TokenPair } from '#layers/core/shared/types/auth'

export interface StoredTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  lifetime?: number
}

export interface TokenStore {
  get: (event: RequestEvent) => Promise<StoredTokens | null>
  set: (event: RequestEvent, tokens: StoredTokens) => Promise<void>
  clear: (event: RequestEvent) => Promise<void>
}

export function toStoredTokens(pair: TokenPair, now = Date.now()): StoredTokens {
  const lifetime = pair.expiresIn ? pair.expiresIn * 1000 : undefined
  return {
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    lifetime,
    expiresAt: lifetime ? now + lifetime : undefined,
  }
}

/** Default: tokens live inside the sealed, httpOnly session cookie (`session.secure`). */
const cookieStore: TokenStore = {
  async get(event) {
    const session = await getUserSession(event)
    const s = session.secure
    if (!s?.accessToken) return null
    return { accessToken: s.accessToken, refreshToken: s.refreshToken, expiresAt: s.expiresAt, lifetime: s.lifetime }
  },
  async set(event, tokens) {
    const session = await getUserSession(event)
    await replaceUserSession(event, {
      ...session,
      secure: { ...tokens },
    }, session.maxAge ? { maxAge: session.maxAge } : undefined)
  },
  async clear(event) {
    await clearUserSession(event)
  },
}

/**
 * For JWTs too large for the 4 KB cookie limit: the cookie holds only a reference, the
 * tokens live in Nitro storage. Use a shared driver (e.g. Redis) for multi-instance deploys.
 */
const storageStore: TokenStore = {
  async get(event) {
    const session = await getUserSession(event)
    const ref = session.secure?.tokenRef
    if (!ref) return null
    return await useStorage('auth-tokens').getItem<StoredTokens>(ref)
  },
  async set(event, tokens) {
    const session = await getUserSession(event)
    const ref = session.secure?.tokenRef ?? crypto.randomUUID()
    await useStorage('auth-tokens').setItem(ref, tokens)
    await replaceUserSession(event, { ...session, secure: { tokenRef: ref } }, session.maxAge ? { maxAge: session.maxAge } : undefined)
  },
  async clear(event) {
    const session = await getUserSession(event)
    const ref = session.secure?.tokenRef
    if (ref) await useStorage('auth-tokens').removeItem(ref)
    await clearUserSession(event)
  },
}

export function useTokenStore(): TokenStore {
  return useRuntimeConfig().authTokenStore === 'storage' ? storageStore : cookieStore
}
