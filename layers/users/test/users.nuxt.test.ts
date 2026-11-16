import { describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useUsersRowActions } from '../app/composables/useUsersRowActions'
import { buildUsersColumns } from '../app/composables/useUsersColumns'
import type { User } from '../shared/types/users'

registerEndpoint('/api/_auth/session', () => ({}))

const user = { id: 'u-2', name: 'B', email: 'b@b.b', avatarUrl: null, phone: null, locale: 'en', createdAt: '', status: 'active', roles: [], lastLoginAt: null } as User

function withPermissions(perms: string[]) {
  useAuthStore().apply({
    user: { id: 'u-1', name: 'Me', email: 'm@m.m', avatarUrl: null, phone: null, locale: 'en', createdAt: '' },
    roles: [],
    permissions: perms,
  })
}

async function actionsFor(perms: string[]) {
  withPermissions(perms)
  let labels: string[] = []
  let selectable = false
  await mountSuspended(defineComponent({
    setup() {
      const { actionsFor, canSelect } = useUsersRowActions({ onEdit: vi.fn(), onDelete: vi.fn(), onView: vi.fn() })
      labels = actionsFor(user).map(i => String(i.label))
      selectable = canSelect.value
      return () => h('div')
    },
  }))
  return { labels, selectable }
}

describe('users row actions per permission set', () => {
  it('viewer', async () => {
    const r = await actionsFor(['users.view'])
    expect(r.labels).toHaveLength(1)
    expect(r.selectable).toBe(false)
  })
  it('manager', async () => {
    expect((await actionsFor(['users.view', 'users.update'])).labels).toHaveLength(2)
  })
  it('admin', async () => {
    const r = await actionsFor(['*'])
    expect(r.labels).toHaveLength(3)
    expect(r.selectable).toBe(true)
  })
})

describe('users column builder', () => {
  it('adds the select column only when selectable and keeps identity columns', () => {
    const deps = { t: (k: string) => k, fmt: { relative: () => '', date: () => '' }, sort: 'name', onSort: vi.fn(), actionsFor: () => [] }
    expect(buildUsersColumns({ ...deps, selectable: false }).map(c => c.id)).toEqual(['name', 'roles', 'status', 'lastLoginAt', 'createdAt', 'actions'])
    expect(buildUsersColumns({ ...deps, selectable: true })[0]?.id).toBe('select')
  })
})
