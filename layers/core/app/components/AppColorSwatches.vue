<script setup lang="ts">
const props = defineProps<{
  colors: readonly string[]
  label: string
}>()
const model = defineModel<string>({ required: true })
const { t } = useI18n()
// Tailwind's `neutral` palette is shadowed by Nuxt UI's semantic color, so it gets a literal fallback.
const swatchStyle = (c: string) => ({ backgroundColor: c === 'neutral' ? '#737373' : `var(--color-${c}-500)` })
void props
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="flex flex-wrap gap-2"
  >
    <UTooltip
      v-for="c in colors"
      :key="c"
      :text="t(`colors.${c}`)"
    >
      <button
        type="button"
        role="radio"
        :aria-checked="model === c"
        :aria-label="t(`colors.${c}`)"
        class="flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-(--ui-bg) transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="model === c ? 'ring-2 ring-(--ui-border-inverted)' : 'hover:scale-110'"
        :style="swatchStyle(c)"
        @click="model = c"
      >
        <UIcon
          v-if="model === c"
          name="i-lucide-check"
          class="size-4 text-white"
        />
      </button>
    </UTooltip>
  </div>
</template>
