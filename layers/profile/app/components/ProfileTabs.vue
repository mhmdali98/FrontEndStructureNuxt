<script setup lang="ts">
const { t } = useI18n()
const items = computed(() => [
  { label: t('profile.general.nav'), icon: 'i-lucide-user', to: '/profile' },
  { label: t('profile.security.nav'), icon: 'i-lucide-key-round', to: '/profile/security' },
])
</script>

<template>
  <UNavigationMenu
    :items="items"
    highlight
    class="-mx-1 mb-(--app-gap) border-b border-default"
  />
</template>
