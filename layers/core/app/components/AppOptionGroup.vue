<script setup lang="ts" generic="T extends string | number | boolean">
/** Segmented control: one button per option, the active one highlighted. */
defineProps<{
  options: { value: T, label: string, icon?: string }[]
  label: string
}>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="grid auto-cols-fr grid-flow-col gap-1 rounded-(--ui-radius) bg-elevated p-1"
  >
    <button
      v-for="o in options"
      :key="String(o.value)"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      class="flex min-h-9 items-center justify-center gap-1.5 rounded-[calc(var(--ui-radius)*0.8)] px-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary"
      :class="model === o.value ? 'bg-default text-highlighted shadow-xs ring ring-default' : 'text-muted hover:text-highlighted'"
      @click="model = o.value"
    >
      <UIcon
        v-if="o.icon"
        :name="o.icon"
        class="size-4 shrink-0"
      />
      <span class="truncate">{{ o.label }}</span>
    </button>
  </div>
</template>
