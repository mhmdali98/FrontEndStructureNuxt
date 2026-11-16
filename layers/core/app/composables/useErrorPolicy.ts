import { ApiError, isAbortError, isSessionExpiredError, normalizeApiError } from '../utils/api-error'

export interface ErrorContext {
  /** Retry action offered on network/5xx toasts. */
  retry?: () => void
}

/**
 * The single place that decides what the user sees for a failed request.
 * Must be called inside the Nuxt context.
 */
export function useErrorPolicy() {
  const notify = useNotify()
  const { t } = useNuxtApp().$i18n
  const online = useOnline()
  const auth = useAuthStore()

  function handleApiError(error: unknown, ctx: ErrorContext = {}): void {
    if (isAbortError(error)) return
    const err = error instanceof ApiError ? error : normalizeApiError(error)
    if (err.code === 'ABORTED') return

    // Session expiry is handled once by the session-expired flow (it shows its own toast).
    if (isSessionExpiredError(err)) return
    // 401s from /api/auth/* are form errors, shown inline.
    if ((err.status === 401 || err.status === 429) && err.url?.includes('/api/auth/')) return

    const retryAction = ctx.retry ? [{ label: t('common.retry'), icon: 'i-lucide-rotate-ccw' as const, onClick: ctx.retry }] : undefined

    if (err.status === 0 || err.code === 'UPSTREAM_UNAVAILABLE' || err.status === 502) {
      notify.error(online.value ? 'errors.network' : 'errors.offline', { id: 'api-network', actions: retryAction })
      return
    }
    switch (err.status) {
      case 400:
      case 409:
        notify.error(err, { id: `api-${err.status}` })
        return
      case 403:
        notify.error('errors.forbidden', { id: 'api-403' })
        void auth.load({ silent: true }).catch(() => undefined)
        return
      case 404:
        return
      case 422:
        // Forms map these onto fields; the global handler stays quiet.
        return
      case 429:
        notify.warning('errors.tooManyRequests', {
          id: 'api-429',
          params: { seconds: err.retryAfter ?? 30 },
        })
        return
      case 503:
        if (err.code === 'MAINTENANCE') {
          void navigateTo('/maintenance')
          return
        }
        break
    }
    if (err.status >= 500 || err.status === 503) {
      notify.error('errors.server', {
        id: 'api-5xx',
        description: err.traceId ? t('errors.traceId', { id: err.traceId }) : undefined,
        actions: [
          ...(retryAction ?? []),
          ...(err.traceId
            ? [{ label: t('common.copyId'), icon: 'i-lucide-copy' as const, onClick: () => { void navigator.clipboard?.writeText(err.traceId ?? '') } }]
            : []),
        ],
      })
      return
    }
    notify.error('errors.generic', { id: `api-${err.status}` })
  }

  return { handleApiError }
}
