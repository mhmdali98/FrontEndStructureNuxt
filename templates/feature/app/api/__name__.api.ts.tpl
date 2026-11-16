import type { ApiClient } from '#layers/core/app/composables/useApiClient'
import type { ListParams, Paginated } from '#layers/core/shared/types/api'
import { serializeListParams, toPaginated } from '#layers/core/app/utils/api-adapters'
import type { __Name__Item } from '#layers/__name__/shared/types/__name__'

export function create__Name__Api(client: ApiClient) {
  return {
    list: async (params: ListParams, signal?: AbortSignal): Promise<Paginated<__Name__Item>> =>
      toPaginated<__Name__Item>(await client.get<unknown>('/__name__', { query: serializeListParams(params), signal })),
  }
}
