import type { Permission, PermissionMode } from './permissions'

export type NavGroup = 'main' | 'management' | 'system'

export interface NavItemConfig {
  labelKey: string
  icon: `i-lucide-${string}`
  to?: string
  /** Only for items without a route; routed items take visibility from route meta. */
  permission?: Permission | Permission[]
  permissionMode?: PermissionMode
  group: NavGroup
  order: number
  children?: Record<string, NavItemConfig>
  badge?: string
  /** e.g. 'g-u' */
  shortcut?: string
  /** Only shown when `runtimeConfig.public.demoMode` is on. */
  demoOnly?: boolean
}

export interface CommandConfig {
  labelKey: string
  icon: `i-lucide-${string}`
  to: string
  permission?: Permission | Permission[]
  shortcut?: string
  order: number
}

/** Entries of the user menu (profile, settings…), registered by feature layers. */
export interface UserMenuItemConfig {
  labelKey: string
  icon: `i-lucide-${string}`
  to: string
  order: number
}
