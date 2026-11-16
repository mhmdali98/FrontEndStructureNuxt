<script setup lang="ts">
const { shortcutsOpen } = useShell()
const { shortcuts } = useRegistryShortcuts()
const { t } = useI18n()
</script>

<template>
  <UModal
    v-model:open="shortcutsOpen"
    :title="t('shell.shortcuts')"
  >
    <template #body>
      <ul class="divide-y divide-default">
        <li class="flex items-center justify-between py-2 text-sm">
          <span>{{ t('shell.search') }}</span>
          <span class="flex gap-1"><UKbd value="meta" /><UKbd value="K" /></span>
        </li>
        <li
          v-for="s in shortcuts"
          :key="s.keys"
          class="flex items-center justify-between py-2 text-sm"
        >
          <span>{{ s.label }}</span>
          <span class="flex gap-1">
            <UKbd
              v-for="k in s.keys.split('-')"
              :key="k"
              :value="k.toUpperCase()"
            />
          </span>
        </li>
      </ul>
    </template>
  </UModal>
</template>
