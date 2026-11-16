import type { ApiClient } from '#layers/core/app/composables/useApiClient'

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  passwordConfirmation: string
}

/** Auth endpoints live on the BFF itself (`/api/auth/*`), not behind `/api/bff`. */
export function createAuthApi(client: ApiClient) {
  const opts = { baseURL: '/api', silent: true } as const
  return {
    login: (body: { email: string, password: string, remember: boolean }) => client.post<{ ok: true }>('/auth/login', body, opts),
    forgotPassword: (email: string) => client.post<{ message: string }>('/auth/forgot-password', { email }, opts),
    resetPassword: (body: ResetPasswordPayload) => client.post<null>('/auth/reset-password', body, opts),
  }
}
