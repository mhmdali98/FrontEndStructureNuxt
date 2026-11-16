import { createError, defineEventHandler, readValidatedBody, setResponseStatus } from 'nuxt/server'
import type { TokenPair } from '#layers/core/shared/types/auth'
import { loginSchema } from '#layers/core/shared/utils/auth-schemas'
import { backendFetch, readJsonSafe } from '../../utils/backend'
import { toStoredTokens, useTokenStore } from '../../utils/token-store'

const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30
const SESSION_MAX_AGE = 60 * 60 * 12

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (raw) => {
    const parsed = loginSchema.safeParse(raw)
    if (parsed.success) return parsed.data
    const errors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      ;(errors[key] ??= []).push(issue.message)
    }
    throw createError({ status: 422, statusText: 'Unprocessable Entity', data: { message: 'Validation failed', code: 'VALIDATION', errors } })
  })

  const res = await backendFetch(event, '/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      'accept-language': event.req.headers.get('accept-language') ?? 'en',
    },
    body: JSON.stringify(body),
  }).catch(() => {
    throw createError({ status: 502, statusText: 'Bad Gateway', data: { code: 'UPSTREAM_UNAVAILABLE', message: 'Backend unavailable' } })
  })

  const payload = await readJsonSafe(res)
  if (!res.ok) {
    // Pass 401 / 422 / 429 (and anything else) through verbatim.
    setResponseStatus(event, res.status)
    const retryAfter = res.headers.get('retry-after')
    if (retryAfter) event.res.headers.set('retry-after', retryAfter)
    return payload
  }

  const pair = payload as TokenPair & { user?: { id: string } }
  const maxAge = body.remember ? REMEMBER_MAX_AGE : SESSION_MAX_AGE
  const tokens = toStoredTokens(pair)

  // Identify the user once so the cookie can carry `{ id }` only.
  let userId = pair.user?.id
  if (!userId) {
    const me = await backendFetch(event, '/auth/me', {
      headers: { authorization: `Bearer ${tokens.accessToken}`, accept: 'application/json' },
    })
    const meBody = await readJsonSafe(me) as { user?: { id?: string } } | null
    userId = meBody?.user?.id ?? 'unknown'
  }

  await setUserSession(event, {
    user: { id: userId },
    loggedInAt: Date.now(),
    maxAge,
    secure: {},
  }, { maxAge })
  await useTokenStore().set(event, tokens)

  return { ok: true }
})
