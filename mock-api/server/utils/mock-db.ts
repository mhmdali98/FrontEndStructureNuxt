/** Deterministic, in-memory fake database for the mock backend. */

export interface MockRole { id: string, name: string, label: string, permissions: string[], system: boolean }
export interface MockUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  phone: string | null
  locale: 'en' | 'ar'
  createdAt: string
  status: 'active' | 'inactive' | 'invited'
  roleIds: string[]
  lastLoginAt: string | null
  password: string
  preferences?: Record<string, unknown>
}
export interface MockActivity {
  id: string
  type: 'user.created' | 'user.updated' | 'user.deleted' | 'role.updated' | 'auth.login'
  actorId: string
  target?: { type: string, id: string, label: string }
  createdAt: string
}

export const DEMO_PASSWORD = 'Password123!'

export const PERMISSION_CATALOG: { key: string, group: string, labelKey: string }[] = [
  { key: 'dashboard.view', group: 'dashboard', labelKey: 'roles.perm.dashboard.view' },
  { key: 'reports.view', group: 'reports', labelKey: 'roles.perm.reports.view' },
  { key: 'users.view', group: 'users', labelKey: 'roles.perm.users.view' },
  { key: 'users.create', group: 'users', labelKey: 'roles.perm.users.create' },
  { key: 'users.update', group: 'users', labelKey: 'roles.perm.users.update' },
  { key: 'users.delete', group: 'users', labelKey: 'roles.perm.users.delete' },
  { key: 'users.export', group: 'users', labelKey: 'roles.perm.users.export' },
  { key: 'roles.view', group: 'roles', labelKey: 'roles.perm.roles.view' },
  { key: 'roles.manage', group: 'roles', labelKey: 'roles.perm.roles.manage' },
  { key: 'system.debug', group: 'system', labelKey: 'roles.perm.system.debug' },
]

function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const EN_FIRST = ['James', 'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Lucas', 'Mia', 'Mason', 'Isabella', 'Logan', 'Amelia', 'Elijah', 'Harper', 'Daniel', 'Grace', 'Henry', 'Chloe']
const EN_LAST = ['Smith', 'Johnson', 'Brown', 'Taylor', 'Anderson', 'Thomas', 'Moore', 'Martin', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright']
const AR_FIRST = ['محمد', 'أحمد', 'علي', 'فاطمة', 'زينب', 'حسن', 'مريم', 'يوسف', 'نور', 'سارة', 'عمر', 'ليلى', 'خالد', 'هدى', 'كريم', 'رنا', 'مصطفى', 'آية', 'حسين', 'دعاء']
const AR_LAST = ['الجبوري', 'العبيدي', 'الحسيني', 'الكعبي', 'التميمي', 'الربيعي', 'الشمري', 'الساعدي', 'العزاوي', 'الدليمي', 'الخفاجي', 'البياتي']
const AR_LATIN: Record<string, string> = {
  محمد: 'mohammed', أحمد: 'ahmed', علي: 'ali', فاطمة: 'fatima', زينب: 'zainab', حسن: 'hassan', مريم: 'maryam',
  يوسف: 'yousif', نور: 'noor', سارة: 'sara', عمر: 'omar', ليلى: 'layla', خالد: 'khalid', هدى: 'huda', كريم: 'karim',
  رنا: 'rana', مصطفى: 'mustafa', آية: 'aya', حسين: 'hussein', دعاء: 'duaa',
}

export interface MockDb {
  roles: MockRole[]
  users: MockUser[]
  activity: MockActivity[]
  seq: number
}

const DAY = 86_400_000

function seed(now: number): MockDb {
  const r = rng(20261116)
  const pick = <T>(list: readonly T[]): T => list[Math.floor(r() * list.length)]!

  const roles: MockRole[] = [
    { id: 'r-admin', name: 'admin', label: 'Administrator', permissions: ['*'], system: true },
    { id: 'r-manager', name: 'manager', label: 'Manager', permissions: ['dashboard.view', 'reports.view', 'users.view', 'users.create', 'users.update', 'roles.view'], system: true },
    { id: 'r-viewer', name: 'viewer', label: 'Viewer', permissions: ['dashboard.view', 'users.view'], system: true },
    { id: 'r-noaccess', name: 'noaccess', label: 'No access', permissions: [], system: true },
    { id: 'r-support', name: 'support', label: 'Support', permissions: ['dashboard.view', 'users.view', 'users.update'], system: false },
  ]

  const iso = (t: number) => new Date(t).toISOString()
  const users: MockUser[] = [
    { id: 'u-1', name: 'Sara Admin', email: 'admin@demo.test', avatarUrl: null, phone: '+964 770 000 0001', locale: 'en', createdAt: iso(now - 400 * DAY), status: 'active', roleIds: ['r-admin'], lastLoginAt: iso(now - 3600_000), password: DEMO_PASSWORD },
    { id: 'u-2', name: 'علي المدير', email: 'manager@demo.test', avatarUrl: null, phone: '+964 770 000 0002', locale: 'ar', createdAt: iso(now - 300 * DAY), status: 'active', roleIds: ['r-manager'], lastLoginAt: iso(now - 2 * DAY), password: DEMO_PASSWORD },
    { id: 'u-3', name: 'Victor Viewer', email: 'viewer@demo.test', avatarUrl: null, phone: null, locale: 'en', createdAt: iso(now - 200 * DAY), status: 'active', roleIds: ['r-viewer'], lastLoginAt: iso(now - 5 * DAY), password: DEMO_PASSWORD },
    { id: 'u-4', name: 'Nadia Newcomer', email: 'noaccess@demo.test', avatarUrl: null, phone: null, locale: 'en', createdAt: iso(now - 10 * DAY), status: 'active', roleIds: ['r-noaccess'], lastLoginAt: null, password: DEMO_PASSWORD },
  ]
  const statuses: MockUser['status'][] = ['active', 'active', 'active', 'active', 'inactive', 'invited']
  const assignable = ['r-manager', 'r-viewer', 'r-support', 'r-viewer', 'r-viewer']
  for (let i = 5; i <= 250; i++) {
    const arabic = r() < 0.5
    let name: string
    let handle: string
    if (arabic) {
      const first = pick(AR_FIRST)
      const last = pick(AR_LAST)
      name = `${first} ${last}`
      handle = `${AR_LATIN[first] ?? 'user'}.${i}`
    }
    else {
      const first = pick(EN_FIRST)
      const last = pick(EN_LAST)
      name = `${first} ${last}`
      handle = `${first.toLowerCase()}.${last.toLowerCase()}${i}`
    }
    const status = pick(statuses)
    const created = now - Math.floor(r() * 380 + 1) * DAY
    users.push({
      id: `u-${i}`,
      name,
      email: `${handle}@example.com`,
      avatarUrl: null,
      phone: r() < 0.6 ? `+964 7${Math.floor(r() * 10)}${Math.floor(r() * 10)} ${String(Math.floor(r() * 9000000) + 1000000).replace(/(\d{3})(\d{4})/, '$1 $2')}` : null,
      locale: arabic ? 'ar' : 'en',
      createdAt: iso(created),
      status,
      roleIds: [pick(assignable)],
      lastLoginAt: status === 'invited' ? null : iso(now - Math.floor(r() * 60 * DAY)),
      password: DEMO_PASSWORD,
    })
  }

  const types: MockActivity['type'][] = ['user.created', 'user.updated', 'auth.login', 'role.updated', 'user.deleted']
  const activity: MockActivity[] = Array.from({ length: 40 }, (_, i) => {
    const type = pick(types)
    const target = users[5 + Math.floor(r() * 200)]!
    return {
      id: `a-${i + 1}`,
      type,
      actorId: pick(['u-1', 'u-2', 'u-1', 'u-3']),
      target: type === 'role.updated'
        ? { type: 'role', id: 'r-support', label: 'Support' }
        : type === 'auth.login' ? undefined : { type: 'user', id: target.id, label: target.name },
      createdAt: iso(now - i * 47 * 60_000 - Math.floor(r() * 30 * 60_000)),
    }
  })

  return { roles, users, activity, seq: 1000 }
}

let db: MockDb | null = null

export function useMockDb(): MockDb {
  if (!db) db = seed(Date.now())
  return db
}

export function resetMockDb(): MockDb {
  db = seed(Date.now())
  resetAuthState()
  return db
}

/* ── Tokens ──────────────────────────────────────────────────────────── */

interface AccessRecord { userId: string, expiresAt: number }
interface RefreshRecord { userId: string, replacedBy?: { access: string, refresh: string, expiresIn: number }, graceUntil?: number }

const accessTokens = new Map<string, AccessRecord>()
const refreshTokens = new Map<string, RefreshRecord>()

function resetAuthState(): void {
  accessTokens.clear()
  refreshTokens.clear()
}

function token(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

export function issueTokens(userId: string, ttlSeconds: number): { accessToken: string, refreshToken: string, expiresIn: number, tokenType: 'Bearer' } {
  const accessToken = token('at')
  const refreshToken = token('rt')
  accessTokens.set(accessToken, { userId, expiresAt: Date.now() + ttlSeconds * 1000 })
  refreshTokens.set(refreshToken, { userId })
  return { accessToken, refreshToken, expiresIn: ttlSeconds, tokenType: 'Bearer' }
}

/** Rotates a refresh token; the old one stays valid for a 10 s grace window. */
export function rotateRefresh(refreshToken: string, ttlSeconds: number): ReturnType<typeof issueTokens> | null {
  const rec = refreshTokens.get(refreshToken)
  if (!rec) return null
  const now = Date.now()
  if (rec.replacedBy) {
    if (rec.graceUntil && rec.graceUntil > now) {
      return { accessToken: rec.replacedBy.access, refreshToken: rec.replacedBy.refresh, expiresIn: rec.replacedBy.expiresIn, tokenType: 'Bearer' }
    }
    return null
  }
  const next = issueTokens(rec.userId, ttlSeconds)
  rec.replacedBy = { access: next.accessToken, refresh: next.refreshToken, expiresIn: ttlSeconds }
  rec.graceUntil = now + 10_000
  return next
}

export function revokeRefresh(refreshToken?: string, allDevicesFor?: string): void {
  if (refreshToken) refreshTokens.delete(refreshToken)
  if (allDevicesFor) {
    for (const [k, v] of refreshTokens) if (v.userId === allDevicesFor) refreshTokens.delete(k)
    for (const [k, v] of accessTokens) if (v.userId === allDevicesFor) accessTokens.delete(k)
  }
}

export function userForAccessToken(accessToken: string | undefined): MockUser | null {
  if (!accessToken) return null
  const rec = accessTokens.get(accessToken)
  if (!rec || rec.expiresAt < Date.now()) return null
  return useMockDb().users.find(u => u.id === rec.userId) ?? null
}

export function permissionsFor(user: MockUser): string[] {
  const roles = useMockDb().roles.filter(r => user.roleIds.includes(r.id))
  return [...new Set(roles.flatMap(r => r.permissions))]
}

export function permissionsVersion(): string {
  const db = useMockDb()
  let h = 0
  for (const r of db.roles) for (const ch of r.id + r.permissions.join(',')) h = (h * 31 + ch.charCodeAt(0)) | 0
  return (h >>> 0).toString(36)
}

/* ── Metrics ─────────────────────────────────────────────────────────── */

export function metrics(rangeDays: number): {
  revenue: { date: string, revenue: number, expenses: number }[]
  orders: { date: string, pending: number, completed: number, cancelled: number }[]
} {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const revenue: { date: string, revenue: number, expenses: number }[] = []
  const orders: { date: string, pending: number, completed: number, cancelled: number }[] = []
  for (let i = rangeDays - 1; i >= 0; i--) {
    const t = today.getTime() - i * DAY
    const day = Math.floor(t / DAY)
    const r = rng(day)
    const season = 1 + 0.25 * Math.sin(day / 9)
    const rev = Math.round((14000 + r() * 6000) * season)
    revenue.push({ date: new Date(t).toISOString().slice(0, 10), revenue: rev, expenses: Math.round(rev * (0.55 + r() * 0.2)) })
    const total = Math.round((120 + r() * 60) * season)
    const cancelled = Math.round(total * (0.04 + r() * 0.05))
    const pending = Math.round(total * (0.1 + r() * 0.1))
    orders.push({ date: new Date(t).toISOString().slice(0, 10), pending, completed: total - pending - cancelled, cancelled })
  }
  return { revenue, orders }
}
