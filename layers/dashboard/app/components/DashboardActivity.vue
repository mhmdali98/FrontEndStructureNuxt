<script setup lang="ts">
import { useDashboardActivityQuery } from '../composables/useDashboardQueries'

const { t } = useI18n()
const fmt = useFormat()
const { data, isLoading, error, refetch } = useDashboardActivityQuery()

const ICONS: Record<string, `i-lucide-${string}`> = {
  'user.created': 'i-lucide-user-plus',
  'user.updated': 'i-lucide-user-pen',
  'user.deleted': 'i-lucide-user-x',
  'role.updated': 'i-lucide-shield',
  'auth.login': 'i-lucide-log-in',
}
</script>

<template>
  <UCard
    variant="outline"
    :ui="{ header: 'p-4 sm:px-5', body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <h2 class="text-base font-medium text-highlighted">
        {{ t('dashboard.activity.title') }}
      </h2>
      <p class="mt-0.5 text-sm text-muted">
        {{ t('dashboard.activity.description') }}
      </p>
    </template>
    <div
      v-if="isLoading && !data"
      class="space-y-4 p-4 sm:p-5"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="flex items-center gap-3"
      >
        <USkeleton class="size-8 rounded-full" />
        <div class="flex-1 space-y-1.5">
          <USkeleton class="h-3.5 w-3/4" />
          <USkeleton class="h-3 w-1/4" />
        </div>
      </div>
    </div>
    <AppInlineError
      v-else-if="error && !data"
      @retry="refetch()"
    />
    <AppEmptyState
      v-else-if="!data?.items.length"
      icon="i-lucide-history"
    />
    <ul
      v-else
      class="divide-y divide-default"
    >
      <li
        v-for="item in data.items"
        :key="item.id"
        class="flex items-start gap-3 px-4 py-3 sm:px-5"
      >
        <UAvatar
          :src="item.actor.avatarUrl ?? undefined"
          :alt="item.actor.name"
          size="sm"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm text-default">
            {{ t(`dashboard.activity.types.${item.type}`, { actor: item.actor.name, target: item.target?.label ?? '' }) }}
          </p>
          <p class="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <UIcon
              :name="ICONS[item.type] ?? 'i-lucide-dot'"
              class="size-3.5"
            />
            <time :datetime="item.createdAt">{{ fmt.relative(item.createdAt) }}</time>
          </p>
        </div>
      </li>
    </ul>
  </UCard>
</template>
