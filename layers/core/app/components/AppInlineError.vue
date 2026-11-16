<script setup lang="ts">
defineProps<{ message?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center"
    role="alert"
  >
    <UIcon
      name="i-lucide-circle-alert"
      class="size-6 text-error"
    />
    <p class="text-sm text-muted">
      {{ message ?? $t('common.loadError') }}
    </p>
    <UButton
      size="sm"
      color="neutral"
      variant="outline"
      icon="i-lucide-rotate-ccw"
      :label="$t('common.retry')"
      @click="$emit('retry')"
    />
  </div>
</template>
