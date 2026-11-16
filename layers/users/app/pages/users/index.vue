<script setup lang="ts">
import type { User } from '#layers/users/shared/types/users'

definePageMeta({ permissions: ['users.view'], titleKey: 'users.title' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { can } = usePermissions()

const formOpen = ref(false)
const editing = ref<User | null>(null)

function openCreate(): void {
  editing.value = null
  formOpen.value = true
}
function openEdit(user: User): void {
  editing.value = user
  formOpen.value = true
}

// `?create=1` (from the command palette) opens the create form.
watch(() => route.query.create, (v) => {
  if (v === '1' && can('users.create')) {
    openCreate()
    const { create: _c, ...rest } = route.query
    void router.replace({ query: rest })
  }
}, { immediate: true })
</script>

<template>
  <div>
    <AppPageHeader
      :title="t('users.title')"
      :description="t('users.description')"
    >
      <template #actions>
        <Can permission="users.create">
          <UButton
            icon="i-lucide-user-plus"
            :label="t('users.actions.create')"
            data-testid="users-create"
            @click="openCreate"
          />
        </Can>
      </template>
    </AppPageHeader>
    <UsersTable @edit="openEdit" />
    <LazyUsersFormSlideover
      v-if="formOpen || editing"
      v-model:open="formOpen"
      :user="editing"
      @update:open="(v: boolean) => { if (!v) editing = null }"
    />
  </div>
</template>
