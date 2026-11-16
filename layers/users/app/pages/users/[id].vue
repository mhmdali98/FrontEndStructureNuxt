<script setup lang="ts">
import { ApiError } from '#layers/core/app/utils/api-error'
import { useUsersDetailQuery } from '../../composables/useUsersQueries'

definePageMeta({ permissions: ['users.view'], titleKey: 'users.detail.title' })

const route = useRoute('users-id')
const { t } = useI18n()
const fmt = useFormat()
const { handleApiError } = useErrorPolicy()
const id = computed(() => String(route.params.id))
const { data: user, isLoading, error, refetch } = useUsersDetailQuery(id)
const formOpen = ref(false)

watch(error, (e) => {
  if (!e) return
  if (e instanceof ApiError && e.status === 404) {
    showError(createError({ status: 404, statusText: 'Not Found', fatal: true }))
  }
  else {
    handleApiError(e)
  }
}, { immediate: true })

const details = computed(() => user.value
  ? [
      { label: t('users.fields.email'), value: user.value.email, icon: 'i-lucide-mail' },
      { label: t('users.fields.phone'), value: user.value.phone ?? '—', icon: 'i-lucide-phone' },
      { label: t('users.fields.lastLogin'), value: user.value.lastLoginAt ? fmt.datetime(user.value.lastLoginAt) : t('common.never'), icon: 'i-lucide-log-in' },
      { label: t('users.fields.createdAt'), value: fmt.date(user.value.createdAt), icon: 'i-lucide-calendar' },
    ]
  : [])
</script>

<template>
  <div>
    <AppPageHeader
      :title="user?.name ?? t('users.detail.title')"
      :breadcrumbs="[{ label: t('users.title'), to: '/users', icon: 'i-lucide-users' }, { label: user?.name ?? '…' }]"
    >
      <template #actions>
        <Can permission="users.update">
          <UButton
            icon="i-lucide-pencil"
            :label="t('common.edit')"
            :disabled="!user"
            @click="formOpen = true"
          />
        </Can>
      </template>
    </AppPageHeader>

    <AppInlineError
      v-if="error && !user && !(error instanceof ApiError && error.status === 404)"
      @retry="refetch()"
    />
    <div
      v-else
      class="grid gap-(--app-gap) lg:grid-cols-3"
    >
      <UCard variant="outline">
        <div
          v-if="isLoading && !user"
          class="flex flex-col items-center gap-3 py-4"
        >
          <USkeleton class="size-20 rounded-full" />
          <USkeleton class="h-5 w-40" />
        </div>
        <div
          v-else-if="user"
          class="flex flex-col items-center gap-3 py-4 text-center"
        >
          <UAvatar
            :src="user.avatarUrl ?? undefined"
            :alt="user.name"
            size="3xl"
          />
          <div>
            <p class="text-lg font-semibold text-highlighted">
              {{ user.name }}
            </p>
            <p class="text-sm text-muted">
              {{ user.email }}
            </p>
          </div>
          <div class="flex flex-wrap justify-center gap-1.5">
            <UsersStatusBadge :status="user.status" />
            <UBadge
              v-for="r in user.roles"
              :key="r.id"
              color="neutral"
              variant="subtle"
              size="sm"
              :label="r.label"
            />
          </div>
        </div>
      </UCard>
      <UCard
        variant="outline"
        class="lg:col-span-2"
      >
        <template #header>
          <h2 class="text-base font-medium text-highlighted">
            {{ t('users.detail.info') }}
          </h2>
        </template>
        <dl class="grid gap-4 sm:grid-cols-2">
          <template v-if="isLoading && !user">
            <USkeleton
              v-for="i in 4"
              :key="i"
              class="h-10"
            />
          </template>
          <div
            v-for="d in details"
            v-else
            :key="d.label"
            class="flex items-start gap-3"
          >
            <UIcon
              :name="d.icon"
              class="mt-0.5 size-4 text-muted"
            />
            <div class="min-w-0">
              <dt class="text-xs text-muted">
                {{ d.label }}
              </dt>
              <dd class="truncate text-sm text-highlighted">
                {{ d.value }}
              </dd>
            </div>
          </div>
        </dl>
      </UCard>
    </div>
    <LazyUsersFormSlideover
      v-if="formOpen && user"
      v-model:open="formOpen"
      :user="user"
    />
  </div>
</template>
