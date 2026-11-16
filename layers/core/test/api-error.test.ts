import { describe, expect, it } from 'vitest'
import { ApiError, isAbortError, isSessionExpiredError, normalizeApiError } from '../app/utils/api-error'

const fetchError = (status: number, data: unknown, headers: Record<string, string> = {}) => ({
  name: 'FetchError',
  message: `[GET] "/x": ${status}`,
  status,
  statusCode: status,
  data,
  response: { status, headers: new Headers(headers), _data: data },
})

describe('normalizeApiError', () => {
  it('reads our own error shape', () => {
    const e = normalizeApiError(fetchError(409, { message: 'Taken', code: 'CONFLICT', traceId: 't1' }))
    expect(e).toBeInstanceOf(ApiError)
    expect(e).toMatchObject({ status: 409, message: 'Taken', code: 'CONFLICT', traceId: 't1' })
  })
  it('maps Laravel 422 field errors', () => {
    const e = normalizeApiError(fetchError(422, { message: 'Invalid', errors: { 'email': ['taken'], 'address.city': ['required'] } }))
    expect(e.fieldErrors).toEqual({ 'email': ['taken'], 'address.city': ['required'] })
  })
  it('reads RFC 9457 ProblemDetails and camelizes PascalCase keys', () => {
    const e = normalizeApiError(fetchError(422, { type: 'about:blank', title: 'Validation', status: 422, detail: 'Bad input', errors: { 'Email': ['bad'], 'Address.City': ['x'] } }))
    expect(e.message).toBe('Bad input')
    expect(e.fieldErrors).toEqual({ 'email': ['bad'], 'address.city': ['x'] })
  })
  it('unwraps the Nitro/H3 envelope recursively', () => {
    const e = normalizeApiError(fetchError(401, { statusCode: 401, statusMessage: 'Unauthorized', message: 'Unauthorized', data: { code: 'SESSION_EXPIRED', message: 'Session expired' } }))
    expect(e).toMatchObject({ status: 401, code: 'SESSION_EXPIRED', message: 'Session expired' })
  })
  it('reads Retry-After', () => {
    expect(normalizeApiError(fetchError(429, { message: 'slow' }, { 'retry-after': '30' })).retryAfter).toBe(30)
  })
  it('detects network errors and timeouts', () => {
    expect(normalizeApiError(new TypeError('fetch failed'))).toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
    const t = new Error('The operation timed out')
    t.name = 'TimeoutError'
    expect(normalizeApiError(t)).toMatchObject({ status: 0, code: 'TIMEOUT' })
  })
  it('flags aborts', () => {
    const abort = new DOMException('aborted', 'AbortError')
    expect(isAbortError(abort)).toBe(true)
    expect(normalizeApiError(abort).code).toBe('ABORTED')
  })
  it('falls back for unknown values', () => {
    expect(normalizeApiError('boom')).toMatchObject({ status: 0, code: 'UNKNOWN' })
  })
})

describe('isSessionExpiredError (401 scoping)', () => {
  const err = (status: number, url?: string, code?: string) => new ApiError({ status, message: '', url, code })
  it('starts the flow for BFF 401/419/440', () => {
    expect(isSessionExpiredError(err(401, '/api/bff/users'))).toBe(true)
    expect(isSessionExpiredError(err(419, '/api/bff/users'))).toBe(true)
    expect(isSessionExpiredError(err(440, '/api/bff/users'))).toBe(true)
  })
  it('never for /api/auth/* 401s', () => {
    expect(isSessionExpiredError(err(401, '/api/auth/login'))).toBe(false)
  })
  it('always for SESSION_EXPIRED', () => {
    expect(isSessionExpiredError(err(400, undefined, 'SESSION_EXPIRED'))).toBe(true)
  })
})
