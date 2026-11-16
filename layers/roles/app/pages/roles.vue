<script setup lang="ts">
import type { Role } from '#layers/roles/shared/types/roles'
import { useRolesMutations, useRolesQueries } from '../composables/useRolesQueries'

definePageMeta({ permissions: ['roles.view'], titleKey: 'roles.title' })

const { t } = useI18n()
const fmt = useFormat()
const notify = useNotify()
const route = useRoute()
const router = useRouter()
const { confirm } = useConfirm()
const { can } = usePermissions()
const { roles, permissions } = useRolesQueries()
const { remove } = useRolesMutations()

const selectedId = ref<string | null>(null)
const selected = computed(() => roles.data.value?.find(r => r.id === selectedId.value) ?? roles.data.value?.[0] ?? null)
const formOpen = ref(false)
const editing = ref<Role | null>(null)
const matrixModel = computed({ get: () => selected.value?.permissions ?? [], set: () => undefined })

function openCreate(): void {
  editing.value = null
  formOpen.value = true
}
function openEdit(role: Role): void {
  editing.value = role
  formOpen.value = true
}

async function deleteRole(role: Role): Promise<void> {
  const ok = await confirm({ title: t('roles.delete.title', { name: role.label }), description: t('roles.delete.description'), confirmLabel: t('common.delete'), danger: true })
  if (!ok) return
  try {
    await remove.mutateAsync(role.id)
    notify.success('roles.delete.done', { params: { name: role.label } })
    selectedId.value = null
  }
  catch {
    // 409 (in use / system) is shown by the error policy
  }
}

watch(() => route.query.create, (v) => {
  if (v === '1' && can('roles.manage')) {
    openCreate()
    void router.replace({ query: {} })
  }
}, { immediate: true })
</script>

<template>
  <div>
    <AppPageHeader
      :title="t('roles.title')"
      :description="t('roles.description')"
    >
      <template #actions>
        <Can permission="roles.manage">
          <UButton
            icon="i-lucide-shield-plus"
            :label="t('roles.actions.create')"
            data-testid="roles-create"
            @click="openCreate"
          />
        </Can>
      </template>
    </AppPageHeader>

    <AppInlineError
      v-if="roles.error.value && !roles.data.value"
      @retry="roles.refetch()"
    />
    <div
      v-else
      class="grid gap-(--app-gap) lg:grid-cols-3"
    >
      <UCard
        variant="outline"
        :ui="{ body: 'p-2 sm:p-2' }"
      >
        <div
          v-if="roles.isLoading.value && !roles.data.value"
          class="space-y-2 p-2"
        >
          <USkeleton
            v-for="i in 5"
            :key="i"
            class="h-14"
          />
        </div>
        <ul
          v-else
          class="flex flex-col gap-1"
          role="listbox"
          :aria-label="t('roles.title')"
        >
          <li
            v-for="r in roles.data.value"
            :key="r.id"
            role="option"
            :aria-selected="selected?.id === r.id"
          >
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-(--ui-radius) px-3 py-2.5 text-start transition focus-visible:outline-2 focus-visible:outline-primary"
              :class="selected?.id === r.id ? 'bg-elevated' : 'hover:bg-elevated/50'"
              @click="selectedId = r.id"
            >
              <span class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <UIcon
                  :name="r.permissions.includes('*') ? 'i-lucide-crown' : 'i-lucide-shield'"
                  class="size-4"
                />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-highlighted">{{ r.label }}</span>
                <span class="block text-xs text-muted">{{ t('roles.usersCount', { count: fmt.number(r.usersCount) }) }}</span>
              </span>
              <UBadge
                v-if="r.system"
                color="neutral"
                variant="subtle"
                size="sm"
                :label="t('roles.system')"
              />
            </button>
          </li>
        </ul>
      </UCard>

      <UCard
        variant="outline"
        class="lg:col-span-2"
      >
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-base font-medium text-highlighted">
                {{ selected?.label ?? '…' }}
              </h2>
              <p class="font-mono text-xs text-muted">
                {{ selected?.name }}
              </p>
            </div>
            <Can permission="roles.manage">
              <div
                v-if="selected && selected.name !== 'admin'"
                class="flex gap-2"
              >
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-pencil"
                  :label="t('common.edit')"
                  data-testid="roles-edit"
                  @click="openEdit(selected)"
                />
                <UButton
                  v-if="!selected.system"
                  color="error"
                  variant="soft"
                  icon="i-lucide-trash-2"
                  :label="t('common.delete')"
                  data-testid="roles-delete"
                  @click="deleteRole(selected)"
                />
              </div>
            </Can>
          </div>
        </template>
        <USkeleton
          v-if="permissions.isLoading.value && !permissions.data.value"
          class="h-64"
        />
        <template v-else-if="selected && permissions.data.value">
          <UAlert
            v-if="selected.permissions.includes('*')"
            class="mb-4"
            color="info"
            variant="subtle"
            icon="i-lucide-crown"
            :title="t('roles.superAdmin')"
          />
          <RolesPermissionMatrix
            v-model="matrixModel"
            :definitions="permissions.data.value"
            readonly
          />
        </template>
      </UCard>
    </div>

    <LazyRolesFormSlideover
      v-if="formOpen"
      v-model:open="formOpen"
      :role="editing"
      :definitions="permissions.data.value ?? []"
    />
  </div>
</template>
