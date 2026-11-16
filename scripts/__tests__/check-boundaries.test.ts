import { describe, expect, it } from 'vitest'
import { scanFile } from '../check-boundaries.mjs'

const features = ['users', 'roles', 'auth']

describe('check-boundaries', () => {
  it('flags cross-feature components, composables, i18n keys and imports', () => {
    const src = [
      `<RolesPermissionMatrix />`,
      `const q = useRolesQueries()`,
      `t('roles.title')`,
      `import x from '#layers/roles/app/api/roles.api'`,
      `<LazyRolesFormSlideover v-if="x" />`,
    ].join('\n')
    expect(scanFile(src, 'users', features).map(v => v.kind)).toEqual(['component', 'component', 'composable', 'i18n key', 'layer import'])
  })
  it('ignores own feature, permission strings, generics and core-owned names', () => {
    const src = [
      `<UsersTable />`,
      `can('roles.view')`,
      `const u = ref<AuthUser | null>(null)`,
      `const auth = useAuthStore()`,
    ].join('\n')
    expect(scanFile(src, 'users', features, new Set(['useAuthStore']))).toEqual([])
  })
  it('flags core using a feature', () => {
    expect(scanFile(`<UsersTable />`, 'core', features)).toHaveLength(1)
  })
})
