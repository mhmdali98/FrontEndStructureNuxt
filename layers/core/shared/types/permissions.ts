declare global {
  /**
   * Registry of permission keys. Feature layers augment it:
   * `declare global { interface AppPermissions { 'users.view': true } }`
   */

  interface AppPermissions {
    'dashboard.view': true
    'reports.view': true
    'system.debug': true
  }
}

export type Permission = Extract<keyof AppPermissions, string> | '*' | `${string}.*`

export type PermissionMode = 'any' | 'all'
