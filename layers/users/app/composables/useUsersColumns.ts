import { h } from 'vue'
import { UAvatar, UBadge, UButton, UCheckbox, UDropdownMenu, UsersStatusBadge } from '#components'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { User } from '#layers/users/shared/types/users'
import type { Formatter } from '#layers/core/app/composables/useFormat'

export const USERS_SORTABLE = ['name', 'status', 'lastLoginAt', 'createdAt'] as const

export interface UsersColumnsDeps {
  t: (key: string, params?: Record<string, unknown>) => string
  fmt: Pick<Formatter, 'relative' | 'date'>
  sort: string
  onSort: (sort: string) => void
  selectable: boolean
  actionsFor: (user: User) => DropdownMenuItem[]
}

/** Cycles none → asc → desc for a column. */
export function nextSort(current: string, column: string): string {
  if (current === column) return `-${column}`
  if (current === `-${column}`) return '-createdAt'
  return column
}

/** Column definitions (TanStack) for the users table. */
export function buildUsersColumns(d: UsersColumnsDeps): TableColumn<User>[] {
  const sortHeader = (id: string, labelKey: string) => () => {
    const active = d.sort === id ? 'asc' : d.sort === `-${id}` ? 'desc' : null
    return h(UButton, {
      'color': 'neutral',
      'variant': 'ghost',
      'size': 'xs',
      'class': '-mx-2',
      'label': d.t(labelKey),
      'trailingIcon': active === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : active === 'desc' ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-down',
      'aria-sort': active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : 'none',
      'onClick': () => d.onSort(nextSort(d.sort, id)),
    })
  }

  const cols: TableColumn<User>[] = []
  if (d.selectable) {
    cols.push({
      id: 'select',
      header: ({ table }) => h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (v: unknown) => table.toggleAllPageRowsSelected(v === true),
        'aria-label': d.t('users.table.selectAll'),
      }),
      cell: ({ row }) => h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'disabled': !row.getCanSelect(),
        'onUpdate:modelValue': (v: unknown) => row.toggleSelected(v === true),
        'aria-label': d.t('users.table.selectRow'),
      }),
      enableHiding: false,
    })
  }
  cols.push(
    {
      id: 'name',
      accessorKey: 'name',
      header: sortHeader('name', 'users.fields.name'),
      enableHiding: false,
      cell: ({ row }) => h('div', { class: 'flex items-center gap-3 min-w-0' }, [
        h(UAvatar, { src: row.original.avatarUrl ?? undefined, alt: row.original.name, size: 'sm' }),
        h('div', { class: 'min-w-0' }, [
          h('p', { class: 'font-medium text-highlighted truncate' }, row.original.name),
          h('p', { class: 'text-muted truncate' }, row.original.email),
        ]),
      ]),
    },
    {
      id: 'roles',
      header: d.t('users.fields.roles'),
      meta: { class: { th: 'hidden md:table-cell', td: 'hidden md:table-cell' } },
      cell: ({ row }) => h('div', { class: 'flex flex-wrap gap-1' }, row.original.roles.map(r =>
        h(UBadge, { key: r.id, color: 'neutral', variant: 'subtle', size: 'sm', label: r.label }))),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: sortHeader('status', 'users.fields.status'),
      cell: ({ row }) => h(UsersStatusBadge, { status: row.original.status }),
    },
    {
      id: 'lastLoginAt',
      accessorKey: 'lastLoginAt',
      header: sortHeader('lastLoginAt', 'users.fields.lastLogin'),
      meta: { class: { th: 'hidden lg:table-cell', td: 'hidden lg:table-cell text-muted' } },
      cell: ({ row }) => row.original.lastLoginAt ? d.fmt.relative(row.original.lastLoginAt) : d.t('common.never'),
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: sortHeader('createdAt', 'users.fields.createdAt'),
      meta: { class: { th: 'hidden lg:table-cell', td: 'hidden lg:table-cell text-muted tabular-nums' } },
      cell: ({ row }) => d.fmt.date(row.original.createdAt),
    },
    {
      id: 'actions',
      enableHiding: false,
      header: () => h('span', { class: 'sr-only' }, d.t('common.actions')),
      meta: { class: { td: 'text-end w-12' } },
      cell: ({ row }) => h(UDropdownMenu, {
        items: d.actionsFor(row.original),
        content: { align: 'end' },
      }, () => h(UButton, {
        'icon': 'i-lucide-ellipsis-vertical',
        'color': 'neutral',
        'variant': 'ghost',
        'size': 'sm',
        'aria-label': d.t('users.table.rowActions', { name: row.original.name }),
      })),
    },
  )
  return cols
}
