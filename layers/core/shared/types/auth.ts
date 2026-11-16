import type { AppearanceSettings } from './appearance'

export type LocaleCode = 'en' | 'ar'

export interface AuthUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  phone: string | null
  locale: LocaleCode
  createdAt: string
}

export interface TokenPair {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType?: 'Bearer'
}

export interface MeResponse {
  user: AuthUser
  roles: string[]
  permissions: string[]
  permissionsVersion?: string
  preferences?: { appearance?: Partial<AppearanceSettings> }
}

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
}
