import type { DropdownMenuItem } from '@nuxt/ui'
import type { User } from '#layers/users/shared/types/users'

export interface UsersRowActionDeps {
  can: (p: 'users.update' | 'users.delete') => boolean
  currentUserId: string | undefined
  t: (key: string) => string
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onView: (user: User) => void
}

/** Pure builder: only permitted actions; self-delete stays visible but disabled. */
export function buildUsersRowActions(user: User, deps: UsersRowActionDeps): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [
    { label: deps.t('users.actions.view'), icon: 'i-lucide-eye', onSelect: () => deps.onView(user) },
  ]
  if (deps.can('users.update')) items.push({ label: deps.t('common.edit'), icon: 'i-lucide-pencil', onSelect: () => deps.onEdit(user) })
  if (deps.can('users.delete')) {
    const self = user.id === deps.currentUserId
    items.push({
      label: self ? deps.t('users.actions.cannotDeleteSelf') : deps.t('common.delete'),
      icon: 'i-lucide-trash-2',
      color: 'error',
      disabled: self,
      onSelect: () => deps.onDelete(user),
    })
  }
  return items
}

/** Whether the actions column carries anything beyond "view". */
export function hasManageActions(can: UsersRowActionDeps['can']): boolean {
  return can('users.update') || can('users.delete')
}

export function useUsersRowActions(handlers: Pick<UsersRowActionDeps, 'onEdit' | 'onDelete' | 'onView'>) {
  const { can } = usePermissions()
  const auth = useAuthStore()
  const { t } = useI18n()
  const deps = computed<UsersRowActionDeps>(() => ({ can, currentUserId: auth.user?.id, t, ...handlers }))
  return {
    actionsFor: (user: User) => buildUsersRowActions(user, deps.value),
    canSelect: computed(() => can('users.delete')),
  }
}
