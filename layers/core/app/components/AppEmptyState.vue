<script setup lang="ts">
withDefaults(defineProps<{
  icon?: `i-lucide-${string}`
  title?: string
  description?: string
}>(), { icon: 'i-lucide-inbox' })
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
    <div class="flex size-11 items-center justify-center rounded-full bg-elevated">
      <UIcon
        :name="icon"
        class="size-5 text-muted"
      />
    </div>
    <p class="text-sm font-medium text-highlighted">
      {{ title ?? $t('common.emptyTitle') }}
    </p>
    <p class="max-w-sm text-sm text-muted">
      {{ description ?? $t('common.emptyHint') }}
    </p>
    <div
      v-if="$slots.default"
      class="mt-2"
    >
      <slot />
    </div>
  </div>
</template>
