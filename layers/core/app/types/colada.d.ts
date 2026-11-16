import type { ApiError } from '../utils/api-error'

declare module '@pinia/colada' {
  interface TypesConfig {
    defaultError: ApiError
    queryMeta: { silentError?: boolean }
    mutationMeta: { silentError?: boolean }
  }
}

export {}
