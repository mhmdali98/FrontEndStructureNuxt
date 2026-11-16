import { isSessionExpiredError, normalizeApiError } from '../utils/api-error'

export interface RequestOptions {
  query?: Record<string, unknown>
  signal?: AbortSignal
  /** Never trigger global side effects (session-expired flow). */
  silent?: boolean
  /** Defaults to `/api/bff`; the auth feature uses `/api`. */
  baseURL?: string
  headers?: Record<string, string>
}

export type ApiClient = ReturnType<typeof useApiClient>

/**
 * Typed HTTP client over the `$api` instance. Every failure is re-thrown as an {@link ApiError}.
 */
export function useApiClient() {
  const nuxtApp = useNuxtApp()
  const $api = nuxtApp.$api

  async function request<T>(method: string, url: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const baseURL = options.baseURL ?? '/api/bff'
    try {
      return await $api(url, {
        method: method as 'GET',
        baseURL,
        query: options.query,
        body: body as BodyInit | Record<string, unknown> | undefined,
        signal: options.signal,
        headers: options.headers,
      }) as T
    }
    catch (e) {
      const err = normalizeApiError(e)
      err.url = `${baseURL}${url}`
      if (!options.silent && err.code !== 'ABORTED' && isSessionExpiredError(err)) {
        void nuxtApp.runWithContext(() => startSessionExpiredFlow(nuxtApp))
      }
      throw err
    }
  }

  return {
    get: <T>(url: string, options?: RequestOptions) => request<T>('GET', url, undefined, options),
    post: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>('POST', url, body, options),
    put: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', url, body, options),
    patch: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', url, body, options),
    delete: <T>(url: string, options?: RequestOptions) => request<T>('DELETE', url, undefined, options),
    upload: <T>(url: string, form: FormData, options?: RequestOptions) => request<T>('POST', url, form, options),
  }
}
