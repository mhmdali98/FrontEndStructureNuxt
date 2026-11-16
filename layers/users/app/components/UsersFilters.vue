<script setup lang="ts">
import { USER_STATUSES, type UserStatus } from '#layers/users/shared/types/users'
import { useUsersRoleOptions } from '../composables/useUsersQueries'

const props = defineProps<{ search: string, status: UserStatus[], roles: string[] }>()
const emit = defineEmits<{ update: [patch: { search?: string, status?: UserStatus[], roles?: string[] }] }>()
const { t } = useI18n()
const { data: roleOptions, isLoading: rolesLoading } = useUsersRoleOptions()

const searchInput = ref(props.search)
const debounced = refDebounced(searchInput, 300)
watch(debounced, v => emit('update', { search: v.trim() }))
watch(() => props.search, (v) => {
  if (v !== searchInput.value.trim()) searchInput.value = v
})

const statusItems = computed(() => USER_STATUSES.map(s => ({ label: t(`users.status.${s}`), value: s })))
const roleItems = computed(() => (roleOptions.value ?? []).map(r => ({ label: r.label, value: r.id })))
</script>

<template>
  <div class="flex flex-1 flex-wrap items-center gap-2">
    <UInput
      v-model="searchInput"
      icon="i-lucide-search"
      :placeholder="t('users.filters.search')"
      :aria-label="t('users.filters.search')"
      class="w-full sm:w-64"
      data-testid="users-search"
    >
      <template
        v-if="searchInput"
        #trailing
      >
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-x"
          :aria-label="t('common.clear')"
          @click="searchInput = ''"
        />
      </template>
    </UInput>
    <USelect
      :model-value="status"
      :items="statusItems"
      multiple
      :placeholder="t('users.filters.status')"
      :aria-label="t('users.filters.status')"
      class="w-full sm:w-40"
      data-testid="users-filter-status"
      @update:model-value="(v) => emit('update', { status: v as UserStatus[] })"
    />
    <USelect
      :model-value="roles"
      :items="roleItems"
      multiple
      :loading="rolesLoading"
      :placeholder="t('users.filters.role')"
      :aria-label="t('users.filters.role')"
      class="w-full sm:w-40"
      @update:model-value="(v) => emit('update', { roles: v as string[] })"
    />
    <UButton
      v-if="status.length || roles.length || search"
      color="neutral"
      variant="ghost"
      icon="i-lucide-filter-x"
      :label="t('common.clear')"
      @click="() => { searchInput = ''; emit('update', { search: '', status: [], roles: [] }) }"
    />
  </div>
</template>
