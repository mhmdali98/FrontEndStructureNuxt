<script setup lang="ts">
const online = useOnline()
</script>

<template>
  <div
    v-if="!online"
    role="status"
    class="flex items-center gap-2 border-b border-default bg-warning/10 px-4 py-2 text-sm text-warning"
  >
    <UIcon
      name="i-lucide-wifi-off"
      class="size-4 shrink-0"
    />
    {{ $t('shell.offline') }}
  </div>
</template>
