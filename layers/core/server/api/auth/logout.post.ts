import { defineEventHandler, readBody } from 'nuxt/server'
import { backendFetch } from '../../utils/backend'
import { useTokenStore } from '../../utils/token-store'

export default defineEventHandler(async (event) => {
  const { allDevices = false } = await readBody<{ allDevices?: boolean } | null>(event).catch(() => null) ?? {}
  const store = useTokenStore()
  const tokens = await store.get(event).catch(() => null)
  if (tokens) {
    // Best effort: the local session ends regardless of the backend's answer.
    await backendFetch(event, '/auth/logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${tokens.accessToken}` },
      body: JSON.stringify({ refreshToken: tokens.refreshToken, allDevices }),
    }).catch(() => undefined)
  }
  await store.clear(event)
  return { ok: true }
})
