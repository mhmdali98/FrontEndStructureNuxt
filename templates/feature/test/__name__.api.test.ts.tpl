import { describe, expect, it } from 'vitest'
import { create__Name__Api } from '../app/api/__name__.api'

describe('__name__ api', () => {
  it('normalizes list responses', async () => {
    const client = { get: async () => ({ data: [{ id: '1', name: 'A', createdAt: '' }], meta: { page: 1, perPage: 10, total: 1, lastPage: 1 } }) }
    const api = create__Name__Api(client as never)
    const res = await api.list({ page: 1 })
    expect(res.meta.total).toBe(1)
    expect(res.data[0]?.name).toBe('A')
  })
})
