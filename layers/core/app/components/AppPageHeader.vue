<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

defineProps<{
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
}>()
</script>

<template>
  <div class="mb-(--app-gap) flex flex-col gap-3">
    <UBreadcrumb
      v-if="breadcrumbs?.length"
      :items="breadcrumbs"
      :ui="{ separatorIcon: 'rtl:rotate-180' }"
    />
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-highlighted">
          {{ title }}
        </h1>
        <p
          v-if="description"
          class="mt-1 text-sm text-muted"
        >
          {{ description }}
        </p>
      </div>
      <div
        v-if="$slots.actions"
        class="flex flex-wrap items-center gap-2"
      >
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </div>
</template>
