<script setup lang="ts">
/** Card chrome for charts: title, actions, fixed-height skeleton, error with retry, empty state. */
withDefaults(defineProps<{
  title: string
  description?: string
  loading?: boolean
  error?: boolean
  empty?: boolean
  height?: number
}>(), { height: 280 })
defineEmits<{ retry: [] }>()
</script>

<template>
  <UCard
    variant="outline"
    :ui="{ header: 'p-4 sm:px-5', body: 'p-4 sm:p-5' }"
  >
    <template #header>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-base font-medium text-highlighted">
            {{ title }}
          </h2>
          <p
            v-if="description"
            class="mt-0.5 text-sm text-muted"
          >
            {{ description }}
          </p>
        </div>
        <slot name="actions" />
      </div>
    </template>
    <div :style="{ minHeight: `${height}px` }">
      <USkeleton
        v-if="loading"
        class="w-full"
        :style="{ height: `${height}px` }"
      />
      <AppInlineError
        v-else-if="error"
        :style="{ height: `${height}px` }"
        @retry="$emit('retry')"
      />
      <AppEmptyState
        v-else-if="empty"
        icon="i-lucide-chart-no-axes-column"
        :style="{ height: `${height}px` }"
      />
      <slot v-else />
    </div>
  </UCard>
</template>
