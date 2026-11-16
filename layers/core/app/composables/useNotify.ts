import type { ApiError } from '../utils/api-error'

type Level = 'success' | 'info' | 'warning' | 'error'

const LEVEL_UI: Record<Level, { color: 'success' | 'info' | 'warning' | 'error', icon: `i-lucide-${string}` }> = {
  success: { color: 'success', icon: 'i-lucide-circle-check' },
  info: { color: 'info', icon: 'i-lucide-info' },
  warning: { color: 'warning', icon: 'i-lucide-triangle-alert' },
  error: { color: 'error', icon: 'i-lucide-circle-x' },
}

export interface NotifyOptions {
  /** Stable id: repeated toasts with the same id merge instead of stacking. */
  id?: string
  description?: string
  params?: Record<string, unknown>
  duration?: number
  actions?: { label: string, icon?: `i-lucide-${string}`, onClick: () => void }[]
}

/**
 * Translated toast notifications. Messages are i18n keys (or an ApiError whose
 * message has already been chosen by the error policy).
 */
export function useNotify() {
  const toast = useToast()
  const { t } = useNuxtApp().$i18n

  function show(level: Level, keyOrError: string | ApiError, options: NotifyOptions = {}): void {
    const title = typeof keyOrError === 'string' ? t(keyOrError, options.params ?? {}) : keyOrError.message
    const id = options.id ?? `${level}:${title}`
    const ui = LEVEL_UI[level]
    toast.add({
      id,
      title,
      description: options.description,
      color: ui.color,
      icon: ui.icon,
      duration: options.duration,
      actions: options.actions?.map(a => ({
        label: a.label,
        icon: a.icon,
        size: 'xs' as const,
        variant: 'outline' as const,
        color: 'neutral' as const,
        onClick: a.onClick,
      })),
    })
  }

  return {
    success: (k: string | ApiError, o?: NotifyOptions) => show('success', k, o),
    info: (k: string | ApiError, o?: NotifyOptions) => show('info', k, o),
    warning: (k: string | ApiError, o?: NotifyOptions) => show('warning', k, o),
    error: (k: string | ApiError, o?: NotifyOptions) => show('error', k, o),
    remove: (id: string) => toast.remove(id),
  }
}
