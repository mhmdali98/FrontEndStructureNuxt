declare global {
  interface AppPermissions {
    'roles.view': true
    'roles.manage': true
  }
}

export interface Role {
  id: string
  name: string
  label: string
  permissions: string[]
  usersCount: number
  system: boolean
}

export interface PermissionDef { key: string, group: string, labelKey: string }

export interface RoleInput { name: string, label: string, permissions: string[] }
