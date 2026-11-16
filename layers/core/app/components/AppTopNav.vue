<script setup lang="ts">
const { groups } = useNavigation()
const items = computed(() => groups.value.flat())
</script>

<template>
  <UNavigationMenu
    :items="items"
    orientation="horizontal"
    content-orientation="vertical"
    class="hidden min-w-0 lg:flex"
    :ui="{ link: 'px-2.5' }"
  />
</template>
