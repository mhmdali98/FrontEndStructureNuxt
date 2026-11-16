/**
 * Bridge between code that runs outside the Nuxt context (Pinia Colada global hooks)
 * and the Nuxt-aware error policy registered by the `colada-errors` plugin.
 * Plain, non-reactive and client-only by design.
 */
export interface ErrorMeta {
  silentError?: boolean
}

type Handler = (error: unknown, meta?: ErrorMeta) => void

let handler: Handler | null = null
const pending: Array<[unknown, ErrorMeta | undefined]> = []

export function setApiErrorHandler(fn: Handler | null): void {
  handler = fn
  if (fn) {
    while (pending.length) {
      const [e, m] = pending.shift()!
      fn(e, m)
    }
  }
}

export function emitApiError(error: unknown, meta?: ErrorMeta): void {
  if (meta?.silentError) return
  if (handler) handler(error, meta)
  else if (pending.length < 20) pending.push([error, meta])
}
