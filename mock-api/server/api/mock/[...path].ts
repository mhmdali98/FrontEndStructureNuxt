import { defineEventHandler, getRequestURL, setResponseStatus, useRuntimeConfig, type RequestEvent } from 'nuxt/server'
import {
  PERMISSION_CATALOG, issueTokens, metrics, permissionsFor, permissionsVersion,
  resetMockDb, revokeRefresh, rotateRefresh, useMockDb, userForAccessToken,
  type MockRole, type MockUser,
} from '../../utils/mock-db'

/* ── tiny router ─────────────────────────────────────────────────────── */

interface Ctx {
  event: RequestEvent
  params: Record<string, string>
  query: URLSearchParams
  user: MockUser | null
  body: () => Promise<Record<string, unknown>>
}
type Result = { status: number, body?: unknown, headers?: Record<string, string> }
type Handler = (ctx: Ctx) => Result | Promise<Result>
interface Route { method: string, parts: string[], handler: Handler }

const routes: Route[] = []
const on = (method: string, path: string, handler: Handler) => routes.push({ method, parts: path.split('/').filter(Boolean), handler })

const ok = (body?: unknown, status = 200): Result => ({ status, body })
const fail = (status: number, message: string, extra: Record<string, unknown> = {}): Result => ({
  status,
  body: { message, traceId: status >= 500 ? `trc_${crypto.randomUUID().slice(0, 8)}` : undefined, ...extra },
})
const unprocessable = (errors: Record<string, string[]>): Result => fail(422, 'The given data was invalid.', { code: 'VALIDATION', errors })

function can(user: MockUser, permission: string): boolean {
  const perms = permissionsFor(user)
  if (perms.includes('*') || perms.includes(permission)) return true
  return perms.includes(`${permission.split('.')[0]}.*`)
}

function guard(ctx: Ctx, ...permissions: string[]): Result | null {
  if (!ctx.user) return fail(401, 'Unauthenticated.', { code: 'UNAUTHENTICATED' })
  if (permissions.length && !permissions.some(p => can(ctx.user!, p))) return fail(403, 'This action is unauthorized.', { code: 'FORBIDDEN' })
  return null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
let maintenanceUntil = 0
const failedLogins = new Map<string, number[]>()

/* ── DTOs ────────────────────────────────────────────────────────────── */

function authUser(u: MockUser) {
  return { id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl, phone: u.phone, locale: u.locale, createdAt: u.createdAt }
}
function userDto(u: MockUser) {
  const roles = useMockDb().roles.filter(r => u.roleIds.includes(r.id)).map(r => ({ id: r.id, name: r.name, label: r.label }))
  return { ...authUser(u), status: u.status, roles, lastLoginAt: u.lastLoginAt }
}
function roleDto(r: MockRole) {
  return { ...r, usersCount: useMockDb().users.filter(u => u.roleIds.includes(r.id)).length }
}

/* ── auth ────────────────────────────────────────────────────────────── */

const ttl = () => Number(useRuntimeConfig().mockAccessTtl ?? 120)

on('POST', 'auth/login', async (ctx) => {
  const b = await ctx.body()
  const email = String(b.email ?? '').trim().toLowerCase()
  const password = String(b.password ?? '')
  const errors: Record<string, string[]> = {}
  if (!email) errors.email = ['The email field is required.']
  else if (!EMAIL_RE.test(email)) errors.email = ['The email must be a valid email address.']
  if (!password) errors.password = ['The password field is required.']
  if (Object.keys(errors).length) return unprocessable(errors)

  const now = Date.now()
  const attempts = (failedLogins.get(email) ?? []).filter(t => now - t < 60_000)
  if (attempts.length >= 5) return { ...fail(429, 'Too many login attempts.', { code: 'TOO_MANY_ATTEMPTS' }), headers: { 'retry-after': '60' } }

  const user = useMockDb().users.find(u => u.email === email)
  if (!user || user.password !== password || user.status !== 'active') {
    failedLogins.set(email, [...attempts, now])
    return fail(401, 'These credentials do not match our records.', { code: 'INVALID_CREDENTIALS' })
  }
  failedLogins.delete(email)
  user.lastLoginAt = new Date().toISOString()
  return ok({ ...issueTokens(user.id, ttl()), user: authUser(user) })
})

on('POST', 'auth/refresh', async (ctx) => {
  const b = await ctx.body()
  const next = rotateRefresh(String(b.refreshToken ?? ''), ttl())
  return next ? ok(next) : fail(401, 'Invalid refresh token.', { code: 'INVALID_REFRESH_TOKEN' })
})

on('POST', 'auth/logout', async (ctx) => {
  const b = await ctx.body()
  revokeRefresh(typeof b.refreshToken === 'string' ? b.refreshToken : undefined, b.allDevices && ctx.user ? ctx.user.id : undefined)
  return ok(undefined, 204)
})

on('GET', 'auth/me', (ctx) => {
  const denied = guard(ctx)
  if (denied) return denied
  const u = ctx.user!
  const roles = useMockDb().roles.filter(r => u.roleIds.includes(r.id)).map(r => r.name)
  return ok({ user: authUser(u), roles, permissions: permissionsFor(u), permissionsVersion: permissionsVersion(), preferences: u.preferences })
})

on('POST', 'auth/forgot-password', () => ok({ message: 'If the account exists, a reset link has been sent.' }, 202))

on('POST', 'auth/reset-password', async (ctx) => {
  const b = await ctx.body()
  const errors: Record<string, string[]> = {}
  if (String(b.password ?? '').length < 8) errors.password = ['The password must be at least 8 characters.']
  if (b.password !== b.passwordConfirmation) errors.passwordConfirmation = ['The password confirmation does not match.']
  if (Object.keys(errors).length) return unprocessable(errors)
  if (b.token !== 'demo-reset-token') return fail(401, 'This password reset token is invalid.', { code: 'INVALID_TOKEN' })
  const user = useMockDb().users.find(u => u.email === String(b.email ?? '').toLowerCase())
  if (user) user.password = String(b.password)
  return ok(undefined, 204)
})

on('GET', 'health', () => maintenanceUntil > Date.now()
  ? fail(503, 'Down for maintenance.', { code: 'MAINTENANCE' })
  : ok({ status: 'ok' }))

/* ── profile ─────────────────────────────────────────────────────────── */

on('PATCH', 'profile', async (ctx) => {
  const denied = guard(ctx)
  if (denied) return denied
  const b = await ctx.body()
  const errors: Record<string, string[]> = {}
  if (b.name !== undefined && String(b.name).trim().length < 2) errors.name = ['The name must be at least 2 characters.']
  if (b.locale !== undefined && !['en', 'ar'].includes(String(b.locale))) errors.locale = ['The selected locale is invalid.']
  if (Object.keys(errors).length) return unprocessable(errors)
  const u = ctx.user!
  if (b.name !== undefined) u.name = String(b.name).trim()
  if (b.phone !== undefined) u.phone = b.phone ? String(b.phone) : null
  if (b.locale !== undefined) u.locale = b.locale as 'en' | 'ar'
  return ok(authUser(u))
})

on('POST', 'profile/avatar', async (ctx) => {
  const denied = guard(ctx)
  if (denied) return denied
  const form = await ctx.event.req.formData().catch(() => null)
  const file = form?.get('avatar')
  if (!file || typeof file === 'string') return unprocessable({ avatar: ['The avatar field is required.'] })
  if (file.size > 1024 * 1024) return unprocessable({ avatar: ['The avatar must not be greater than 1 MB.'] })
  if (!file.type.startsWith('image/')) return unprocessable({ avatar: ['The avatar must be an image.'] })
  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
  ctx.user!.avatarUrl = `data:${file.type};base64,${base64}`
  return ok({ avatarUrl: ctx.user!.avatarUrl })
})

on('PUT', 'profile/password', async (ctx) => {
  const denied = guard(ctx)
  if (denied) return denied
  const b = await ctx.body()
  const errors: Record<string, string[]> = {}
  if (b.currentPassword !== ctx.user!.password) errors.currentPassword = ['The current password is incorrect.']
  if (String(b.password ?? '').length < 8) errors.password = ['The password must be at least 8 characters.']
  if (b.password !== b.passwordConfirmation) errors.passwordConfirmation = ['The password confirmation does not match.']
  if (Object.keys(errors).length) return unprocessable(errors)
  ctx.user!.password = String(b.password)
  return ok(undefined, 204)
})

on('PUT', 'profile/preferences', async (ctx) => {
  const denied = guard(ctx)
  if (denied) return denied
  const b = await ctx.body()
  ctx.user!.preferences = { appearance: b.appearance }
  return ok(undefined, 204)
})

/* ── dashboard ───────────────────────────────────────────────────────── */

const rangeDays = (q: URLSearchParams) => ({ '7d': 7, '30d': 30, '90d': 90 } as Record<string, number>)[q.get('range') ?? '30d'] ?? 30

on('GET', 'dashboard/summary', (ctx) => {
  const denied = guard(ctx, 'dashboard.view', 'reports.view')
  if (denied) return denied
  const days = rangeDays(ctx.query)
  const cur = metrics(days * 2)
  const prev = { revenue: cur.revenue.slice(0, days), orders: cur.orders.slice(0, days) }
  const now = { revenue: cur.revenue.slice(days), orders: cur.orders.slice(days) }
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const ordersOf = (list: typeof now.orders) => list.map(o => o.pending + o.completed + o.cancelled)
  const trend = (xs: number[]) => xs.slice(-12)
  const avg = (xs: number[]) => xs.length ? +(sum(xs) / xs.length).toFixed(4) : 0
  const newUsers = (list: typeof now.orders) => list.map(o => Math.round(o.completed / 6))
  const conversion = (list: typeof now.orders) => list.map(o => +(o.completed / ((o.pending + o.completed + o.cancelled) * 26)).toFixed(4))
  const kpis = [
    { key: 'revenue', value: sum(now.revenue.map(x => x.revenue)), previous: sum(prev.revenue.map(x => x.revenue)), unit: 'currency', trend: trend(now.revenue.map(x => x.revenue)), permission: 'reports.view' },
    { key: 'orders', value: sum(ordersOf(now.orders)), previous: sum(ordersOf(prev.orders)), unit: 'number', trend: trend(ordersOf(now.orders)), permission: 'dashboard.view' },
    { key: 'newUsers', value: sum(newUsers(now.orders)), previous: sum(newUsers(prev.orders)), unit: 'number', trend: trend(newUsers(now.orders)), permission: 'dashboard.view' },
    { key: 'conversion', value: avg(conversion(now.orders)), previous: avg(conversion(prev.orders)), unit: 'percent', trend: trend(conversion(now.orders)), permission: 'dashboard.view' },
  ]
  return ok({ kpis: kpis.filter(k => can(ctx.user!, k.permission)).map(({ permission: _p, ...k }) => k) })
})

on('GET', 'dashboard/revenue', (ctx) => {
  const denied = guard(ctx, 'reports.view')
  return denied ?? ok({ points: metrics(rangeDays(ctx.query)).revenue })
})

on('GET', 'dashboard/orders-by-status', (ctx) => {
  const denied = guard(ctx, 'dashboard.view')
  return denied ?? ok({ points: metrics(rangeDays(ctx.query)).orders })
})

on('GET', 'dashboard/traffic-sources', (ctx) => {
  const denied = guard(ctx, 'dashboard.view')
  if (denied) return denied
  const f = rangeDays(ctx.query)
  return ok({ items: [
    { source: 'direct', value: 410 * f },
    { source: 'search', value: 380 * f },
    { source: 'social', value: 220 * f },
    { source: 'referral', value: 130 * f },
    { source: 'email', value: 90 * f },
  ] })
})

on('GET', 'dashboard/activity', (ctx) => {
  const denied = guard(ctx, 'users.view')
  if (denied) return denied
  const limit = Math.min(Number(ctx.query.get('limit') ?? 8), 50)
  const db = useMockDb()
  return ok({ items: db.activity.slice(0, limit).map((a) => {
    const actor = db.users.find(u => u.id === a.actorId)!
    return { id: a.id, type: a.type, actor: { id: actor.id, name: actor.name, avatarUrl: actor.avatarUrl }, target: a.target, createdAt: a.createdAt }
  }) })
})

/* ── users ───────────────────────────────────────────────────────────── */

on('GET', 'users', (ctx) => {
  const denied = guard(ctx, 'users.view')
  if (denied) return denied
  const q = ctx.query
  let list = [...useMockDb().users]
  const search = (q.get('search') ?? '').trim().toLowerCase()
  if (search) list = list.filter(u => u.name.toLowerCase().includes(search) || u.email.includes(search))
  const statuses = (q.get('filter[status]') ?? '').split(',').filter(Boolean)
  if (statuses.length) list = list.filter(u => statuses.includes(u.status))
  const roleIds = [...(q.get('filter[role]') ?? '').split(','), ...q.getAll('filter[role][]')].filter(Boolean)
  if (roleIds.length) list = list.filter(u => u.roleIds.some(r => roleIds.includes(r)))
  const sorts = (q.get('sort') ?? '-createdAt').split(',').filter(Boolean)
  list.sort((a, b) => {
    for (const s of sorts) {
      const desc = s.startsWith('-')
      const key = (desc ? s.slice(1) : s) as keyof MockUser
      const av = String(a[key] ?? '')
      const bv = String(b[key] ?? '')
      const c = av.localeCompare(bv)
      if (c !== 0) return desc ? -c : c
    }
    return 0
  })
  const perPage = Math.min(Math.max(Number(q.get('perPage') ?? 10), 1), 100)
  const total = list.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const page = Math.min(Math.max(Number(q.get('page') ?? 1), 1), lastPage)
  return ok({ data: list.slice((page - 1) * perPage, page * perPage).map(userDto), meta: { page, perPage, total, lastPage } })
})

on('GET', 'users/:id', (ctx) => {
  const denied = guard(ctx, 'users.view')
  if (denied) return denied
  const u = useMockDb().users.find(x => x.id === ctx.params.id)
  return u ? ok(userDto(u)) : fail(404, 'User not found.', { code: 'NOT_FOUND' })
})

function validateUser(b: Record<string, unknown>, existing?: MockUser): Record<string, string[]> {
  const db = useMockDb()
  const errors: Record<string, string[]> = {}
  const name = String(b.name ?? '').trim()
  const email = String(b.email ?? '').trim().toLowerCase()
  if (name.length < 2) errors.name = ['The name must be at least 2 characters.']
  if (!EMAIL_RE.test(email)) errors.email = ['The email must be a valid email address.']
  else if (db.users.some(u => u.email === email && u.id !== existing?.id)) errors.email = ['The email has already been taken.']
  const roleIds = Array.isArray(b.roleIds) ? b.roleIds.map(String) : []
  if (roleIds.length === 0) errors.roleIds = ['Select at least one role.']
  else if (roleIds.some(id => !db.roles.some(r => r.id === id))) errors.roleIds = ['The selected role is invalid.']
  if (!['active', 'inactive', 'invited'].includes(String(b.status))) errors.status = ['The selected status is invalid.']
  if (!existing && String(b.password ?? '').length < 8) errors.password = ['The password must be at least 8 characters.']
  return errors
}

function logActivity(actor: MockUser, type: 'user.created' | 'user.updated' | 'user.deleted' | 'role.updated', target: { type: string, id: string, label: string }) {
  const db = useMockDb()
  db.activity.unshift({ id: `a-${++db.seq}`, type, actorId: actor.id, target, createdAt: new Date().toISOString() })
}

on('POST', 'users', async (ctx) => {
  const denied = guard(ctx, 'users.create')
  if (denied) return denied
  const b = await ctx.body()
  const errors = validateUser(b)
  if (Object.keys(errors).length) return unprocessable(errors)
  const db = useMockDb()
  const user: MockUser = {
    id: `u-${++db.seq}`,
    name: String(b.name).trim(),
    email: String(b.email).trim().toLowerCase(),
    phone: b.phone ? String(b.phone) : null,
    avatarUrl: null,
    locale: 'en',
    createdAt: new Date().toISOString(),
    status: b.status as MockUser['status'],
    roleIds: (b.roleIds as unknown[]).map(String),
    lastLoginAt: null,
    password: String(b.password),
  }
  db.users.unshift(user)
  logActivity(ctx.user!, 'user.created', { type: 'user', id: user.id, label: user.name })
  return ok(userDto(user), 201)
})

on('PATCH', 'users/:id', async (ctx) => {
  const denied = guard(ctx, 'users.update')
  if (denied) return denied
  const user = useMockDb().users.find(x => x.id === ctx.params.id)
  if (!user) return fail(404, 'User not found.', { code: 'NOT_FOUND' })
  const b = { ...userDto(user), roleIds: user.roleIds, ...(await ctx.body()) }
  const errors = validateUser(b, user)
  if (Object.keys(errors).length) return unprocessable(errors)
  user.name = String(b.name).trim()
  user.email = String(b.email).trim().toLowerCase()
  user.phone = b.phone ? String(b.phone) : null
  user.status = b.status as MockUser['status']
  user.roleIds = (b.roleIds as unknown[]).map(String)
  logActivity(ctx.user!, 'user.updated', { type: 'user', id: user.id, label: user.name })
  return ok(userDto(user))
})

on('DELETE', 'users/:id', (ctx) => {
  const denied = guard(ctx, 'users.delete')
  if (denied) return denied
  const db = useMockDb()
  if (ctx.params.id === ctx.user!.id) return fail(409, 'You cannot delete your own account.', { code: 'SELF_DELETE' })
  const idx = db.users.findIndex(x => x.id === ctx.params.id)
  if (idx < 0) return fail(404, 'User not found.', { code: 'NOT_FOUND' })
  const [removed] = db.users.splice(idx, 1)
  logActivity(ctx.user!, 'user.deleted', { type: 'user', id: removed!.id, label: removed!.name })
  return ok(undefined, 204)
})

on('POST', 'users/bulk-delete', async (ctx) => {
  const denied = guard(ctx, 'users.delete')
  if (denied) return denied
  const ids = ((await ctx.body()).ids as unknown[] ?? []).map(String).filter(id => id !== ctx.user!.id)
  const db = useMockDb()
  db.users = db.users.filter(u => !ids.includes(u.id))
  return ok(undefined, 204)
})

/* ── roles ───────────────────────────────────────────────────────────── */

on('GET', 'roles/options', (ctx) => {
  const denied = guard(ctx, 'users.view', 'roles.view')
  return denied ?? ok(useMockDb().roles.map(r => ({ id: r.id, name: r.name, label: r.label })))
})

on('GET', 'roles', (ctx) => {
  const denied = guard(ctx, 'roles.view')
  return denied ?? ok(useMockDb().roles.map(roleDto))
})

on('GET', 'permissions', (ctx) => {
  const denied = guard(ctx, 'roles.view')
  return denied ?? ok(PERMISSION_CATALOG)
})

function validateRole(b: Record<string, unknown>, existing?: MockRole): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  const name = String(b.name ?? '').trim()
  if (!/^[a-z][a-z0-9_-]{1,30}$/.test(name)) errors.name = ['Use 2–31 lowercase letters, digits, dashes or underscores.']
  else if (useMockDb().roles.some(r => r.name === name && r.id !== existing?.id)) errors.name = ['The name has already been taken.']
  if (String(b.label ?? '').trim().length < 2) errors.label = ['The label must be at least 2 characters.']
  const perms = Array.isArray(b.permissions) ? b.permissions.map(String) : null
  if (!perms) errors.permissions = ['The permissions field is required.']
  else if (perms.some(p => p !== '*' && !PERMISSION_CATALOG.some(c => c.key === p))) errors.permissions = ['Unknown permission.']
  return errors
}

on('POST', 'roles', async (ctx) => {
  const denied = guard(ctx, 'roles.manage')
  if (denied) return denied
  const b = await ctx.body()
  const errors = validateRole(b)
  if (Object.keys(errors).length) return unprocessable(errors)
  const db = useMockDb()
  const role: MockRole = { id: `r-${++db.seq}`, name: String(b.name).trim(), label: String(b.label).trim(), permissions: (b.permissions as unknown[]).map(String), system: false }
  db.roles.push(role)
  return ok(roleDto(role), 201)
})

on('PATCH', 'roles/:id', async (ctx) => {
  const denied = guard(ctx, 'roles.manage')
  if (denied) return denied
  const role = useMockDb().roles.find(r => r.id === ctx.params.id)
  if (!role) return fail(404, 'Role not found.', { code: 'NOT_FOUND' })
  if (role.name === 'admin') return fail(409, 'The administrator role cannot be modified.', { code: 'SYSTEM_ROLE' })
  const b = { ...role, ...(await ctx.body()) }
  const errors = validateRole(b, role)
  if (Object.keys(errors).length) return unprocessable(errors)
  if (!role.system) role.name = String(b.name).trim()
  role.label = String(b.label).trim()
  role.permissions = (b.permissions as unknown[]).map(String)
  logActivity(ctx.user!, 'role.updated', { type: 'role', id: role.id, label: role.label })
  return ok(roleDto(role))
})

on('DELETE', 'roles/:id', (ctx) => {
  const denied = guard(ctx, 'roles.manage')
  if (denied) return denied
  const db = useMockDb()
  const role = db.roles.find(r => r.id === ctx.params.id)
  if (!role) return fail(404, 'Role not found.', { code: 'NOT_FOUND' })
  if (role.system) return fail(409, 'System roles cannot be deleted.', { code: 'SYSTEM_ROLE' })
  if (db.users.some(u => u.roleIds.includes(role.id))) return fail(409, 'This role is assigned to users.', { code: 'ROLE_IN_USE' })
  db.roles = db.roles.filter(r => r.id !== role.id)
  return ok(undefined, 204)
})

/* ── mock-only ───────────────────────────────────────────────────────── */

on('POST', '__reset', () => {
  resetMockDb()
  maintenanceUntil = 0
  failedLogins.clear()
  return ok({ ok: true })
})

on('GET', '__simulate/:status', (ctx) => {
  const status = Number(ctx.params.status)
  switch (status) {
    case 400: return fail(400, 'The request could not be understood.', { code: 'BAD_REQUEST' })
    case 401: return fail(401, 'Unauthenticated.', { code: 'UNAUTHENTICATED' })
    case 403: return fail(403, 'This action is unauthorized.', { code: 'FORBIDDEN' })
    case 404: return fail(404, 'Resource not found.', { code: 'NOT_FOUND' })
    case 409: return fail(409, 'The resource was modified by someone else.', { code: 'CONFLICT' })
    case 422: return unprocessable({ email: ['The email has already been taken.'], name: ['The name must be at least 2 characters.'] })
    case 429: return { ...fail(429, 'Too many requests.', { code: 'TOO_MANY_REQUESTS' }), headers: { 'retry-after': '30' } }
    case 503:
      maintenanceUntil = Date.now() + 60_000
      return fail(503, 'Down for maintenance.', { code: 'MAINTENANCE' })
    default: return fail(500, 'Internal server error.', { code: 'SERVER_ERROR' })
  }
})

/* ── dispatcher ──────────────────────────────────────────────────────── */

function match(method: string, parts: string[]): { route: Route, params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method || route.parts.length !== parts.length) continue
    const params: Record<string, string> = {}
    let matched = true
    for (let i = 0; i < parts.length; i++) {
      const p = route.parts[i]!
      if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(parts[i]!)
      else if (p !== parts[i]) {
        matched = false
        break
      }
    }
    if (matched) return { route, params }
  }
  return null
}

async function delay(): Promise<void> {
  const spec = String(useRuntimeConfig().mockLatencyMs ?? '0')
  const [min, max] = spec.split('-').map(Number)
  const lo = Number.isFinite(min) ? min! : 0
  const hi = Number.isFinite(max) ? max! : lo
  const ms = lo + Math.random() * Math.max(0, hi - lo)
  if (ms > 0) await new Promise(r => setTimeout(r, ms))
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const parts = url.pathname.replace(/^\/api\/mock\/?/, '').split('/').filter(Boolean)
  const method = event.req.method.toUpperCase()
  const found = match(method, parts)
  const auth = event.req.headers.get('authorization')
  const user = userForAccessToken(auth?.startsWith('Bearer ') ? auth.slice(7) : undefined)

  if (!parts[0]?.startsWith('__') && parts[0] !== 'health') await delay()

  let parsed: Record<string, unknown> | undefined
  const ctx: Ctx = {
    event,
    params: found?.params ?? {},
    query: url.searchParams,
    user,
    body: async () => {
      if (parsed) return parsed
      const text = await event.req.text().catch(() => '')
      try {
        parsed = text ? JSON.parse(text) as Record<string, unknown> : {}
      }
      catch {
        parsed = {}
      }
      return parsed
    },
  }

  const result: Result = found
    ? await found.route.handler(ctx)
    : fail(404, 'Route not found.', { code: 'NOT_FOUND' })

  setResponseStatus(event, result.status)
  for (const [k, v] of Object.entries(result.headers ?? {})) event.res.headers.set(k, v)
  if (user) event.res.headers.set('x-permissions-version', permissionsVersion())
  if (result.status === 204 || result.body === undefined) return null
  event.res.headers.set('content-type', 'application/json')
  return result.body
})
