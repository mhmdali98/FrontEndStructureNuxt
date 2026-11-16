<script setup lang="ts">
const { customizerOpen } = useShell()
const { dir } = useAppDirection()
const { t } = useI18n()
</script>

<template>
  <USlideover
    v-model:open="customizerOpen"
    :side="dir === 'rtl' ? 'left' : 'right'"
    :title="t('appearance.customizer')"
    :description="t('appearance.description')"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <AppearanceForm compact />
    </template>
  </USlideover>
</template>
