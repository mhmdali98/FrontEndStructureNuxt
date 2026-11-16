declare global {
  interface AppPermissions {
    '__name__.view': true
  }
}

export interface __Name__Item {
  id: string
  name: string
  createdAt: string
}
