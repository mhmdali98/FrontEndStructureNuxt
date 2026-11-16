declare module '#auth-utils' {
  interface User {
    id: string
  }
  interface UserSession {
    loggedInAt?: number
    /** Cookie lifetime chosen at login (remember me), reused when re-sealing. */
    maxAge?: number
  }
  interface SecureSessionData {
    accessToken?: string
    refreshToken?: string
    /** epoch ms */
    expiresAt?: number
    /** access token lifetime in ms */
    lifetime?: number
    /** `storage` token store: key of the server-side record */
    tokenRef?: string
  }
}

export {}
