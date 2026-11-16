<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  value: string
  icon: `i-lucide-${string}`
  /** fractional change, e.g. 0.12 = +12% */
  delta?: number
  higherIsBetter?: boolean
  trend?: number[]
  loading?: boolean
}>(), { higherIsBetter: true })

const { percent } = useFormat()
const { t } = useI18n()

const deltaColor = computed(() => {
  if (props.delta === undefined || props.delta === 0) return 'neutral' as const
  const good = props.higherIsBetter ? props.delta > 0 : props.delta < 0
  return good ? 'success' as const : 'error' as const
})
const deltaIcon = computed(() => (props.delta ?? 0) >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down')
const sparkData = computed(() => (props.trend ?? []).map((v, i) => ({ i, v })))
</script>

<template>
  <UCard
    variant="outline"
    :ui="{ body: 'p-4 sm:p-5' }"
  >
    <div
      v-if="loading"
      class="space-y-3"
    >
      <USkeleton class="h-4 w-24" />
      <USkeleton class="h-7 w-32" />
      <USkeleton class="h-10 w-full" />
    </div>
    <div
      v-else
      class="flex flex-col gap-3"
    >
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm text-muted">
          {{ label }}
        </p>
        <div class="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <UIcon
            :name="icon"
            class="size-5"
          />
        </div>
      </div>
      <div class="flex flex-wrap items-end gap-2">
        <p class="text-2xl font-semibold tabular-nums text-highlighted">
          {{ value }}
        </p>
        <UBadge
          v-if="delta !== undefined"
          :color="deltaColor"
          variant="subtle"
          size="sm"
          :icon="deltaIcon"
          :label="percent(Math.abs(delta))"
          :aria-label="t('common.deltaAria', { value: percent(delta) })"
        />
      </div>
      <UChart
        v-if="sparkData.length > 1"
        type="area"
        :data="sparkData"
        index="i"
        :categories="['v']"
        :height="40"
        :x-axis="false"
        :y-axis="false"
        :grid="false"
        :legend="false"
        :tooltip="false"
        :aria-label="label"
      />
    </div>
  </UCard>
</template>
