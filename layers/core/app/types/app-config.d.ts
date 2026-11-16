import type { CommandConfig, NavItemConfig, UserMenuItemConfig } from '#layers/core/shared/types/navigation'

declare module 'nuxt/schema' {
  interface AppConfigInput {
    navigation?: Record<string, NavItemConfig>
    commands?: Record<string, CommandConfig>
    userMenu?: Record<string, UserMenuItemConfig>
  }
  interface AppConfig {
    navigation: Record<string, NavItemConfig>
    commands: Record<string, CommandConfig>
    userMenu: Record<string, UserMenuItemConfig>
  }
}

export {}
