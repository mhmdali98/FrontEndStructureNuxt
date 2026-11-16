<script setup lang="ts">
import type { User } from '#layers/users/shared/types/users'
import { USERS_PER_PAGE, useUsersListState } from '../composables/useUsersListState'
import { useUsersListQuery, useUsersMutations } from '../composables/useUsersQueries'
import { buildUsersColumns } from '../composables/useUsersColumns'
import { useUsersRowActions } from '../composables/useUsersRowActions'
import { useUsersExport } from '../composables/useUsersExport'

const emit = defineEmits<{ edit: [user: User] }>()

const { t } = useI18n()
const fmt = useFormat()
const notify = useNotify()
const { confirm } = useConfirm()
const { can } = usePermissions()
const { state, update, params } = useUsersListState()
const { data, isLoading, isPlaceholderData, error, refetch } = useUsersListQuery(params)
const { remove, bulkRemove } = useUsersMutations()
const { exportCsv } = useUsersExport()

async function deleteUser(user: User): Promise<void> {
  const ok = await confirm({
    title: t('users.delete.title', { name: user.name }),
    description: t('users.delete.description'),
    confirmLabel: t('common.delete'),
    danger: true,
  })
  if (!ok) return
  try {
    await remove.mutateAsync(user.id)
    notify.success('users.delete.done', { params: { name: user.name } })
  }
  catch {
    // the error policy already notified the user; the row was restored
  }
}

const { actionsFor, canSelect } = useUsersRowActions({
  onView: user => void navigateTo(`/users/${user.id}`),
  onEdit: user => emit('edit', user),
  onDelete: user => void deleteUser(user),
})

const auth = useAuthStore()
const rowSelection = ref<Record<string, boolean>>({})
const selectedIds = computed(() => Object.keys(rowSelection.value).filter(id => rowSelection.value[id]))
watch(params, () => {
  rowSelection.value = {}
})

const columnVisibility = ref<Record<string, boolean>>({})
const columns = computed(() => buildUsersColumns({
  t,
  fmt,
  sort: state.value.sort,
  onSort: sort => update({ sort }),
  selectable: canSelect.value,
  actionsFor,
}))

const hideable = computed(() => ['roles', 'status', 'lastLoginAt', 'createdAt'].map(id => ({
  label: t(`users.fields.${id === 'lastLoginAt' ? 'lastLogin' : id}`),
  type: 'checkbox' as const,
  checked: columnVisibility.value[id] !== false,
  onUpdateChecked: (v: boolean) => {
    columnVisibility.value = { ...columnVisibility.value, [id]: v }
  },
  onSelect: (e: Event) => e.preventDefault(),
})))

async function deleteSelected(): Promise<void> {
  const ids = selectedIds.value
  const ok = await confirm({
    title: t('users.bulk.title', { count: ids.length }),
    description: t('users.delete.description'),
    confirmLabel: t('common.delete'),
    danger: true,
  })
  if (!ok) return
  try {
    await bulkRemove.mutateAsync(ids)
    rowSelection.value = {}
    notify.success('users.bulk.done', { params: { count: ids.length } })
  }
  catch {
    // handled by the error policy
  }
}

const meta = computed(() => data.value?.meta)
const from = computed(() => meta.value && meta.value.total ? (meta.value.page - 1) * meta.value.perPage + 1 : 0)
const to = computed(() => meta.value ? Math.min(meta.value.page * meta.value.perPage, meta.value.total) : 0)
const rows = computed(() => data.value?.data ?? [])
</script>

<template>
  <UCard
    variant="outline"
    :ui="{ body: 'p-0 sm:p-0', header: 'p-3 sm:px-4', footer: 'p-3 sm:px-4' }"
  >
    <template #header>
      <div
        v-if="selectedIds.length"
        class="flex min-h-9 flex-wrap items-center justify-between gap-2"
      >
        <p class="text-sm font-medium text-highlighted">
          {{ t('common.selected', { count: selectedIds.length }) }}
        </p>
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :label="t('common.clear')"
            @click="rowSelection = {}"
          />
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            :label="t('users.bulk.delete')"
            :loading="bulkRemove.isLoading.value"
            data-testid="users-bulk-delete"
            @click="deleteSelected"
          />
        </div>
      </div>
      <div
        v-else
        class="flex flex-wrap items-center justify-between gap-2"
      >
        <UsersFilters
          :search="state.search"
          :status="state.status"
          :roles="state.roles"
          @update="update"
        />
        <div class="flex items-center gap-2">
          <UDropdownMenu
            :items="hideable"
            :content="{ align: 'end' }"
          >
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-columns-3"
              :label="t('common.columns')"
              class="hidden sm:inline-flex"
            />
          </UDropdownMenu>
          <UButton
            v-if="can('users.export')"
            color="neutral"
            variant="outline"
            icon="i-lucide-download"
            :label="t('common.export')"
            :disabled="!rows.length"
            data-testid="users-export"
            @click="exportCsv(rows)"
          />
        </div>
      </div>
    </template>

    <AppInlineError
      v-if="error && !data"
      @retry="refetch()"
    />
    <UTable
      v-else
      v-model:row-selection="rowSelection"
      v-model:column-visibility="columnVisibility"
      :data="rows"
      :columns="columns"
      :get-row-id="(row: User) => row.id"
      :row-selection-options="{ enableRowSelection: (row) => row.original.id !== auth.user?.id }"
      :loading="isLoading || isPlaceholderData"
      sticky="header"
      :empty="t('common.noResults')"
      :ui="{ base: 'table-fixed md:table-auto', td: 'py-2.5', th: 'py-2.5' }"
      data-testid="users-table"
    >
      <template
        v-if="isLoading && !data"
        #empty
      >
        <div class="space-y-3 p-2">
          <USkeleton
            v-for="i in state.perPage"
            :key="i"
            class="h-9 w-full"
          />
        </div>
      </template>
    </UTable>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm tabular-nums text-muted">
          {{ t('common.showing', { from: fmt.number(from), to: fmt.number(to), total: fmt.number(meta?.total ?? 0) }) }}
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="hidden text-sm text-muted sm:inline">{{ t('common.perPage') }}</span>
            <USelect
              :model-value="state.perPage"
              :items="USERS_PER_PAGE.map(n => ({ label: fmt.number(n), value: n }))"
              :aria-label="t('common.perPage')"
              class="w-20"
              @update:model-value="(v) => update({ perPage: Number(v) })"
            />
          </div>
          <UPagination
            :page="state.page"
            :items-per-page="state.perPage"
            :total="meta?.total ?? 0"
            :sibling-count="1"
            :ui="{ prev: 'rtl:[&_svg]:rotate-180', next: 'rtl:[&_svg]:rotate-180', first: 'rtl:[&_svg]:rotate-180', last: 'rtl:[&_svg]:rotate-180' }"
            @update:page="(p: number) => update({ page: p })"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
