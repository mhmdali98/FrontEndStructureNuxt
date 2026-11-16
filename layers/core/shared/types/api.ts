export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  lastPage: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ListParams {
  page?: number
  perPage?: number
  sort?: string
  search?: string
  filter?: Record<string, string | string[]>
}

/** Standard error body returned by the backend for any non-2xx response. */
export interface ApiErrorBody {
  message: string
  code?: string
  errors?: Record<string, string[]>
  traceId?: string
}
