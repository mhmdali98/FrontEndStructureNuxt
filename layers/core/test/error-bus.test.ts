import { describe, expect, it, vi } from 'vitest'
import { emitApiError, setApiErrorHandler } from '../app/utils/error-bus'

describe('error bus', () => {
  it('buffers errors until a handler is registered', () => {
    setApiErrorHandler(null)
    emitApiError('a')
    const handler = vi.fn()
    setApiErrorHandler(handler)
    expect(handler).toHaveBeenCalledWith('a', undefined)
    emitApiError('b')
    expect(handler).toHaveBeenCalledTimes(2)
  })
  it('drops silent errors', () => {
    const handler = vi.fn()
    setApiErrorHandler(handler)
    emitApiError('x', { silentError: true })
    expect(handler).not.toHaveBeenCalled()
  })
})
