<script setup lang="ts">
const { t } = useI18n()
const items = computed(() => [
  { label: t('settings.appearance.nav'), icon: 'i-lucide-palette', to: '/settings/appearance' },
  { label: t('settings.language.nav'), icon: 'i-lucide-languages', to: '/settings/language' },
])
</script>

<template>
  <UNavigationMenu
    :items="items"
    highlight
    class="-mx-1 mb-(--app-gap) border-b border-default"
  />
</template>
