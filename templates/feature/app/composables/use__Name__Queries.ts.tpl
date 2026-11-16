import type { Ref } from 'vue'
import type { ListParams } from '#layers/core/shared/types/api'
import { create__Name__Api } from '../api/__name__.api'

export const __name__Keys = {
  all: ['__name__'] as const,
  list: (params: ListParams) => ['__name__', 'list', params as Record<string, unknown>] as const,
}

export function use__Name__ListQuery(params: Ref<ListParams>) {
  const api = create__Name__Api(useApiClient())
  return useQuery({
    key: () => __name__Keys.list(params.value),
    query: ({ signal }) => api.list(params.value, signal),
    placeholderData: prev => prev,
  })
}
