/**
 * Normalized error for every failed API call. Whatever the backend, the BFF or the
 * network produced, UI code only ever deals with this shape.
 */
export class ApiError extends Error {
  /** 0 = network error or timeout */
  status: number
  code?: string
  /** 422 field errors, keyed by request field path */
  fieldErrors: Record<string, string[]>
  traceId?: string
  /** seconds, from a 429 Retry-After header */
  retryAfter?: number
  /** Request URL when known; used to scope the 401 policy. */
  url?: string
  raw: unknown

  constructor(init: {
    status: number
    message: string
    code?: string
    fieldErrors?: Record<string, string[]>
    traceId?: string
    retryAfter?: number
    url?: string
    raw?: unknown
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.fieldErrors = init.fieldErrors ?? {}
    this.traceId = init.traceId
    this.retryAfter = init.retryAfter
    this.url = init.url
    this.raw = init.raw
  }
}

type Dict = Record<string, unknown>

function isObject(v: unknown): v is Dict {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function num(v: unknown): number | undefined {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}

function camelPath(key: string): string {
  return key
    .split('.')
    .map(part => part.length > 0 ? part.charAt(0).toLowerCase() + part.slice(1) : part)
    .join('.')
}

function toFieldErrors(errors: unknown, camelize = false): Record<string, string[]> {
  if (!isObject(errors)) return {}
  const out: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(errors)) {
    const field = camelize ? camelPath(key) : key
    if (Array.isArray(value)) out[field] = value.filter((m): m is string => typeof m === 'string')
    else if (typeof value === 'string') out[field] = [value]
  }
  return out
}

interface ParsedBody {
  message?: string
  code?: string
  fieldErrors: Record<string, string[]>
  traceId?: string
  status?: number
}

/** Parses any known error body shape; recursive for the Nitro/H3 envelope. */
function parseBody(body: unknown, depth = 0): ParsedBody {
  if (!isObject(body) || depth > 3) return { fieldErrors: {} }

  // Nitro / H3 envelope: { statusCode|status, statusMessage|statusText, message, data }
  const looksLikeEnvelope = ('statusCode' in body || 'statusMessage' in body || 'statusText' in body)
    || (('status' in body) && ('data' in body))
  if (looksLikeEnvelope) {
    const inner = parseBody(body.data, depth + 1)
    return {
      status: num(body.statusCode) ?? num(body.status),
      message: inner.message ?? str(body.message) ?? str(body.statusMessage) ?? str(body.statusText),
      code: inner.code,
      fieldErrors: inner.fieldErrors,
      traceId: inner.traceId,
    }
  }

  // RFC 9457 ProblemDetails
  if ('title' in body || 'detail' in body || ('type' in body && 'status' in body)) {
    return {
      status: num(body.status),
      message: str(body.detail) ?? str(body.title),
      code: str(body.code),
      fieldErrors: toFieldErrors(body.errors, true),
      traceId: str(body.traceId) ?? str(body.instance),
    }
  }

  // Our shape / Laravel: { message, code?, errors?, traceId? }; generic { error }
  return {
    message: str(body.message) ?? str(body.error),
    code: str(body.code),
    fieldErrors: toFieldErrors(body.errors),
    traceId: str(body.traceId),
  }
}

function isAbort(e: unknown): boolean {
  if (!isObject(e) && !(e instanceof Error)) return false
  const err = e as { name?: unknown, cause?: unknown }
  if (err.name === 'AbortError') return true
  return isObject(err.cause) && (err.cause as { name?: unknown }).name === 'AbortError'
}

/** True for cancellations that must never be shown to the user. */
export function isAbortError(e: unknown): boolean {
  return isAbort(e)
}

/**
 * Converts anything thrown by ofetch, Nuxt or the network into an {@link ApiError}.
 */
export function normalizeApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e

  if (isAbort(e)) {
    return new ApiError({ status: 0, code: 'ABORTED', message: 'Request aborted', raw: e })
  }

  if (isObject(e) || e instanceof Error) {
    const err = e as Dict
    const response = isObject(err.response) ? err.response as Dict : undefined
    const headers = response?.headers instanceof Headers ? response.headers : undefined
    const url = str(isObject(err.request) ? undefined : err.request) ?? str(response?.url)
    const status = num(err.statusCode) ?? num(err.status) ?? num(response?.status)
    const body = err.data ?? response?._data
    const parsed = parseBody(body)
    const retryAfter = num(headers?.get('retry-after'))

    // Timeout / network failures from ofetch: no response at all.
    if (status === undefined && !response) {
      const timedOut = err.name === 'TimeoutError' || /timeout/i.test(String(err.message ?? ''))
      return new ApiError({
        status: 0,
        code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: String(err.message ?? 'Network error'),
        url,
        raw: e,
      })
    }

    return new ApiError({
      status: parsed.status ?? status ?? 0,
      message: parsed.message ?? str(err.statusText) ?? str(err.message) ?? 'Request failed',
      code: parsed.code,
      fieldErrors: parsed.fieldErrors,
      traceId: parsed.traceId,
      retryAfter,
      url,
      raw: e,
    })
  }

  return new ApiError({ status: 0, code: 'UNKNOWN', message: String(e), raw: e })
}

/** Session-expiry statuses; only meaningful for BFF calls (see the error policy). */
export const SESSION_STATUSES = new Set([401, 419, 440])

/**
 * Whether an error must start the session-expired flow. Only BFF calls (or an explicit
 * SESSION_EXPIRED code) qualify; `/api/auth/*` 401s are form errors.
 */
export function isSessionExpiredError(err: ApiError): boolean {
  if (err.code === 'SESSION_EXPIRED') return true
  if (!SESSION_STATUSES.has(err.status)) return false
  if (!err.url) return false
  return err.url.includes('/api/bff/')
}
