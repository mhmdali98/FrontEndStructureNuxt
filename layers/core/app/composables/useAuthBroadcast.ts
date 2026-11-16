export type AuthBroadcastEvent = 'login' | 'logout' | 'expired'

interface AuthMessage { event: AuthBroadcastEvent, tab: string }

/**
 * Per-tab id: BroadcastChannel delivers to every *other channel object*, including ones in
 * the same tab, so messages carry the sender's tab id and receivers ignore their own.
 * Plain, non-reactive and client-only by design.
 */
const TAB_ID = Math.random().toString(36).slice(2)

/** Cross-tab auth sync over `BroadcastChannel('auth')`. `event` only reflects other tabs. */
export function useAuthBroadcast() {
  const { post, data, isSupported } = useBroadcastChannel<AuthMessage, AuthMessage>({ name: 'auth' })
  const event = computed<AuthBroadcastEvent | null>(() => data.value && data.value.tab !== TAB_ID ? data.value.event : null)
  return {
    post: (e: AuthBroadcastEvent) => {
      if (isSupported.value) post({ event: e, tab: TAB_ID })
    },
    event,
  }
}
