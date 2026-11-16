<script setup lang="ts">
const colorMode = useColorMode()
const { t } = useI18n()
const isDark = computed(() => colorMode.value === 'dark')
function toggle(): void {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    square
    :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
    :aria-label="t('shell.toggleColorMode')"
    @click="toggle"
  />
</template>
