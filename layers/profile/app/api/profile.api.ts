import type { ApiClient } from '#layers/core/app/composables/useApiClient'
import type { AuthUser, LocaleCode } from '#layers/core/shared/types/auth'

export interface ProfileInput { name?: string, phone?: string | null, locale?: LocaleCode }
export interface PasswordInput { currentPassword: string, password: string, passwordConfirmation: string }

export function createProfileApi(client: ApiClient) {
  return {
    update: (input: ProfileInput) => client.patch<AuthUser>('/profile', input),
    uploadAvatar: (file: File) => {
      const form = new FormData()
      form.append('avatar', file)
      return client.upload<{ avatarUrl: string }>('/profile/avatar', form)
    },
    changePassword: (input: PasswordInput) => client.put<null>('/profile/password', input),
  }
}
