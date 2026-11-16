import type { CommandConfig } from '#layers/core/shared/types/navigation'
import { checkPermissions } from '../utils/permissions'

export interface ResolvedCommand {
  id: string
  label: string
  icon: string
  to: string
  shortcut?: string
}

/** Feature commands (quick actions) for the palette, filtered by permission. */
export function useCommands() {
  const appConfig = useAppConfig()
  const auth = useAuthStore()
  const { t } = useNuxtApp().$i18n

  const commands = computed<ResolvedCommand[]>(() =>
    Object.entries(appConfig.commands ?? {} as Record<string, CommandConfig>)
      .filter(([, c]) => checkPermissions(auth.permissionSet, c.permission))
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([id, c]) => ({ id, label: t(c.labelKey), icon: c.icon, to: c.to, shortcut: c.shortcut })),
  )

  return { commands }
}
