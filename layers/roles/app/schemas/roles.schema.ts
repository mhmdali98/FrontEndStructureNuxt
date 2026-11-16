import { z } from 'zod'

type T = (key: string, params?: Record<string, unknown>) => string

export function createRoleSchema(t: T) {
  return z.object({
    name: z.string().trim().regex(/^[a-z][a-z0-9_-]{1,30}$/, t('validation.slug')),
    label: z.string().trim().min(2, t('validation.min', { min: 2 })).max(60, t('validation.max', { max: 60 })),
    permissions: z.array(z.string()),
  })
}

export type RoleFormValues = z.output<ReturnType<typeof createRoleSchema>>

/** Groups permission definitions by resource, preserving catalogue order. */
export function groupPermissions<P extends { group: string }>(defs: P[]): { group: string, items: P[] }[] {
  const map = new Map<string, P[]>()
  for (const d of defs) map.set(d.group, [...(map.get(d.group) ?? []), d])
  return [...map.entries()].map(([group, items]) => ({ group, items }))
}

/** True when the role grants the key (exact, `*`, or `<group>.*`). */
export function roleGrants(perms: readonly string[], key: string): boolean {
  if (perms.includes('*') || perms.includes(key)) return true
  return perms.includes(`${key.split('.')[0]}.*`)
}
