import { describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineComponent, h, withDirectives, resolveDirective } from 'vue'
import { Can } from '#components'
import { ApiError } from '../app/utils/api-error'
import { emitApiError } from '../app/utils/error-bus'
import permissionsMiddleware from '../app/middleware/02.permissions.global'

registerEndpoint('/api/_auth/session', () => ({}))

function setPermissions(perms: string[], roles: string[] = []) {
  const auth = useAuthStore()
  auth.apply({
    user: { id: 'u1', name: 'T', email: 't@t.t', avatarUrl: null, phone: null, locale: 'en', createdAt: '' },
    roles,
    permissions: perms,
  })
}

describe('<Can>', () => {
  it('renders the slot only when permitted, else the fallback', async () => {
    setPermissions(['users.view'])
    const ok = await mountSuspended(Can, { props: { permission: 'users.view' }, slots: { default: () => 'yes', fallback: () => 'no' } })
    expect(ok.text()).toBe('yes')
    const denied = await mountSuspended(Can, { props: { permission: 'users.delete' }, slots: { default: () => 'yes', fallback: () => 'no' } })
    expect(denied.text()).toBe('no')
  })
  it('supports any / all / role', async () => {
    setPermissions(['users.view'], ['manager'])
    expect((await mountSuspended(Can, { props: { any: ['users.delete', 'users.view'] }, slots: { default: () => 'y' } })).text()).toBe('y')
    expect((await mountSuspended(Can, { props: { all: ['users.delete', 'users.view'] }, slots: { default: () => 'y' } })).text()).toBe('')
    expect((await mountSuspended(Can, { props: { role: 'manager' }, slots: { default: () => 'y' } })).text()).toBe('y')
  })
})

describe('v-can', () => {
  it('hides or disables elements', async () => {
    setPermissions(['users.view'])
    const Comp = defineComponent({
      setup() {
        const can = resolveDirective('can')!
        return () => h('div', [
          withDirectives(h('button', { id: 'hidden' }, 'x'), [[can, 'users.delete']]),
          withDirectives(h('button', { id: 'disabled' }, 'y'), [[can, 'users.delete', 'disable']]),
          withDirectives(h('button', { id: 'shown' }, 'z'), [[can, 'users.view']]),
        ])
      },
    })
    const w = await mountSuspended(Comp)
    expect((w.find('#hidden').element as HTMLElement).style.display).toBe('none')
    expect(w.find('#disabled').attributes('disabled')).toBeDefined()
    expect((w.find('#shown').element as HTMLElement).style.display).toBe('')
  })
})

describe('useNotify', () => {
  it('merges toasts with the same id', async () => {
    const toast = useToast()
    toast.clear()
    const notify = useNotify()
    notify.error('errors.forbidden', { id: 'api-403' })
    notify.error('errors.forbidden', { id: 'api-403' })
    await vi.waitFor(() => expect(toast.toasts.value.some(t => t.id === 'api-403')).toBe(true))
    expect(toast.toasts.value.filter(t => t.id === 'api-403')).toHaveLength(1)
  })
})

describe('colada errors → error policy', () => {
  it('a failing query produces a toast', async () => {
    const toast = useToast()
    toast.clear()
    emitApiError(new ApiError({ status: 500, message: 'boom', url: '/api/bff/x' }))
    await vi.waitFor(() => expect(toast.toasts.value.some(t => t.id === 'api-5xx')).toBe(true))
  })
  it('silent errors produce nothing', () => {
    const toast = useToast()
    toast.clear()
    emitApiError(new ApiError({ status: 500, message: 'boom' }), { silentError: true })
    expect(toast.toasts.value).toHaveLength(0)
  })
})

describe('appearance plugin', () => {
  it('pushes colors into app config live', async () => {
    const store = useAppearanceStore()
    store.update({ primary: 'rose', secondary: 'teal', neutral: 'zinc' })
    await nextTick()
    const appConfig = useAppConfig()
    expect(appConfig.ui.colors.primary).toBe('rose')
    expect(appConfig.ui.colors.secondary).toBe('teal')
    expect(appConfig.ui.colors.neutral).toBe('zinc')
    store.reset()
  })
})

describe('permissions middleware', () => {
  const route = (meta: Record<string, unknown>) => ({ meta, path: '/x', fullPath: '/x' }) as never

  it('rejects forbidden routes with a fatal 403', async () => {
    setPermissions(['dashboard.view'])
    let thrown: unknown
    try {
      await permissionsMiddleware(route({ permissions: ['roles.view'] }), route({}))
    }
    catch (e) {
      thrown = e
    }
    expect(thrown).toMatchObject({ status: 403, fatal: true })
    clearError()
  })
  it('lets permitted and public routes through', async () => {
    setPermissions(['roles.view'])
    expect(await permissionsMiddleware(route({ permissions: ['roles.view'] }), route({}))).toBeUndefined()
    expect(await permissionsMiddleware(route({ public: true, permissions: ['x.y'] }), route({}))).toBeUndefined()
  })
})
