<script setup lang="ts">
const props = defineProps<{
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
}>()
const emit = defineEmits<{ close: [value: boolean] }>()
const { t } = useI18n()
</script>

<template>
  <UModal
    :title="props.title"
    :description="props.description"
    :ui="{ footer: 'justify-end' }"
    @update:open="(v: boolean) => { if (!v) emit('close', false) }"
  >
    <template #footer>
      <UButton
        color="neutral"
        variant="outline"
        :label="t('common.cancel')"
        @click="emit('close', false)"
      />
      <UButton
        :color="props.danger ? 'error' : 'primary'"
        :label="props.confirmLabel ?? t('common.confirm')"
        autofocus
        @click="emit('close', true)"
      />
    </template>
  </UModal>
</template>
