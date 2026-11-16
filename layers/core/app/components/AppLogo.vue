<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
const config = useRuntimeConfig()
</script>

<template>
  <span class="flex items-center gap-2.5 min-w-0">
    <svg
      viewBox="0 0 32 32"
      class="size-8 shrink-0 text-primary"
      aria-hidden="true"
    >
      <rect
        width="32"
        height="32"
        rx="8"
        fill="currentColor"
      />
      <path
        d="M9 22V10l7 7 7-7v12"
        fill="none"
        stroke="var(--ui-bg)"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span
      v-if="!collapsed"
      class="truncate font-semibold text-highlighted"
    >{{ config.public.appName }}</span>
  </span>
</template>
