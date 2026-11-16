import type { AuthUser } from '#layers/core/shared/types/auth'

declare global {
  interface AppPermissions {
    'users.view': true
    'users.create': true
    'users.update': true
    'users.delete': true
    'users.export': true
  }
}

export type UserStatus = 'active' | 'inactive' | 'invited'
export const USER_STATUSES: readonly UserStatus[] = ['active', 'inactive', 'invited']

export interface UserRoleRef { id: string, name: string, label: string }

export type User = AuthUser & {
  status: UserStatus
  roles: UserRoleRef[]
  lastLoginAt: string | null
}

export interface UserInput {
  name: string
  email: string
  phone?: string | null
  roleIds: string[]
  status: UserStatus
  password?: string
}

export interface UsersListState {
  page: number
  perPage: number
  sort: string
  search: string
  status: UserStatus[]
  roles: string[]
}
