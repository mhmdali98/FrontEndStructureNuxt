import type { NavigationMenuItem } from '@nuxt/ui'
import type { NavGroup, NavItemConfig } from '#layers/core/shared/types/navigation'
import type { Permission, PermissionMode } from '#layers/core/shared/types/permissions'
import { checkPermissions, filterNavigation, type RouteAccess } from '../utils/permissions'

export interface ResolvedNavItem {
  id: string
  label: string
  icon: string
  to?: string
  group: NavGroup
  order: number
  badge?: string
  shortcut?: string
  permission?: Permission | Permission[]
  permissionMode?: PermissionMode
  children?: ResolvedNavItem[]
}

const GROUP_ORDER: NavGroup[] = ['main', 'management', 'system']

function toResolved(entries: Record<string, NavItemConfig>, t: (k: string) => string, demoMode: boolean): ResolvedNavItem[] {
  return Object.entries(entries)
    .filter(([, item]) => demoMode || !item.demoOnly)
    .map(([id, item]) => ({
      id,
      label: t(item.labelKey),
      icon: item.icon,
      to: item.to,
      group: item.group,
      order: item.order,
      badge: item.badge,
      shortcut: item.shortcut,
      permission: item.permission,
      permissionMode: item.permissionMode,
      children: item.children ? toResolved(item.children, t, demoMode) : undefined,
    }))
    .sort((a, b) => a.order - b.order)
}

/**
 * Navigation built from every layer's `app.config.ts` registry, translated and filtered by
 * the user's permissions. Routed items take their rules from the route meta.
 */
export function useNavigation() {
  const appConfig = useAppConfig()
  const router = useRouter()
  const auth = useAuthStore()
  const { t } = useNuxtApp().$i18n
  const demoMode = Boolean(useRuntimeConfig().public.demoMode)

  const resolveMeta = (to: string): RouteAccess => {
    const r = router.resolve(to)
    if (r.matched.length === 0) return { exists: false }
    return { exists: true, permissions: r.meta.permissions, permissionMode: r.meta.permissionMode }
  }

  const visible = computed<ResolvedNavItem[]>(() => {
    const all = toResolved(appConfig.navigation ?? {}, t, demoMode)
    const can = (req: Permission | readonly Permission[] | undefined, mode?: PermissionMode) => checkPermissions(auth.permissionSet, req, mode)
    return filterNavigation(all, can, resolveMeta)
  })

  const groups = computed<NavigationMenuItem[][]>(() =>
    GROUP_ORDER
      .map(group => visible.value.filter(i => i.group === group).map(toMenuItem))
      .filter(list => list.length > 0),
  )

  const groupLabels = computed(() => GROUP_ORDER
    .filter(group => visible.value.some(i => i.group === group))
    .map(group => t(`nav.groups.${group}`)))

  const flat = computed<ResolvedNavItem[]>(() => visible.value.flatMap(i => i.children?.length ? i.children : [i]))

  return { groups, groupLabels, flat, visible }
}

function toMenuItem(item: ResolvedNavItem): NavigationMenuItem {
  return {
    label: item.label,
    icon: item.icon,
    to: item.to,
    badge: item.badge,
    children: item.children?.map(toMenuItem),
    defaultOpen: true,
  }
}
