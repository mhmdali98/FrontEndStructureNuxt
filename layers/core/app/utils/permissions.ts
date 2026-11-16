import type { Permission, PermissionMode } from '#layers/core/shared/types/permissions'

/**
 * Maps backend permission formats to `<resource>.<action>`.
 * Handles Spatie-style "edit articles" → "articles.edit" and `:`/`/` separators.
 */
export function normalizePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out = new Set<string>()
  for (const item of raw) {
    const name = typeof item === 'string'
      ? item
      : (typeof item === 'object' && item !== null && 'name' in item && typeof item.name === 'string')
          ? item.name
          : null
    if (!name) continue
    const trimmed = name.trim().toLowerCase()
    if (trimmed === '*') {
      out.add('*')
      continue
    }
    if (/^[a-z0-9_-]+\s+[a-z0-9_-]+$/.test(trimmed)) {
      const [action, resource] = trimmed.split(/\s+/) as [string, string]
      out.add(`${resource}.${action}`)
      continue
    }
    out.add(trimmed.replace(/[:/]/g, '.'))
  }
  return [...out]
}

/** O(1) matcher: exact, `*`, or `<resource>.*`. */
export function matchPermission(set: ReadonlySet<string>, permission: string): boolean {
  if (set.has('*') || set.has(permission)) return true
  const dot = permission.indexOf('.')
  if (dot > 0 && set.has(`${permission.slice(0, dot)}.*`)) return true
  if (permission.endsWith('.*')) {
    const prefix = permission.slice(0, -1)
    for (const p of set) if (p.startsWith(prefix)) return true
  }
  return false
}

export function checkPermissions(
  set: ReadonlySet<string>,
  required: Permission | readonly Permission[] | undefined,
  mode: PermissionMode = 'all',
): boolean {
  if (required === undefined) return true
  const list = (Array.isArray(required) ? required : [required]) as readonly string[]
  if (list.length === 0) return true
  return mode === 'any'
    ? list.some(p => matchPermission(set, p))
    : list.every(p => matchPermission(set, p))
}

export interface FilterableNavItem {
  to?: string
  permission?: Permission | Permission[]
  permissionMode?: PermissionMode
  children?: FilterableNavItem[]
}

export interface RouteAccess {
  exists: boolean
  permissions?: Permission[]
  permissionMode?: PermissionMode
}

/**
 * Removes items the user may not see. Routed items take their rules from the route meta,
 * so the menu and the guard can never disagree. Parents with no visible children disappear.
 */
export function filterNavigation<T extends FilterableNavItem>(
  items: readonly T[],
  can: (required: Permission | readonly Permission[] | undefined, mode?: PermissionMode) => boolean,
  resolveMeta: (to: string) => RouteAccess,
): T[] {
  const out: T[] = []
  for (const item of items) {
    if (item.children?.length) {
      const children = filterNavigation(item.children as T[], can, resolveMeta)
      if (children.length === 0) continue
      out.push({ ...item, children })
      continue
    }
    if (item.to) {
      const meta = resolveMeta(item.to)
      if (!meta.exists) continue
      if (!can(meta.permissions, meta.permissionMode)) continue
    }
    else if (!can(item.permission, item.permissionMode)) {
      continue
    }
    out.push(item)
  }
  return out
}
