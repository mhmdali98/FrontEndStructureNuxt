import type { Permission, PermissionMode } from '#layers/core/shared/types/permissions'

declare module '#app' {
  interface PageMeta {
    /** No login needed (maintenance) */
    public?: boolean
    /** login, forgot, reset */
    guestOnly?: boolean
    permissions?: Permission[]
    /** default 'all' */
    permissionMode?: PermissionMode
    /** i18n key for <title> and the page header */
    titleKey?: string
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    guestOnly?: boolean
    permissions?: Permission[]
    permissionMode?: PermissionMode
    titleKey?: string
  }
}

export {}
