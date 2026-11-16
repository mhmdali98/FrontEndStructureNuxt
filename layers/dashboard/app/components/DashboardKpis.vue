<script setup lang="ts">
import type { Kpi } from '#layers/dashboard/shared/types/dashboard'
import { KPI_HIGHER_IS_BETTER } from '../composables/useDashboardQueries'

const props = defineProps<{ kpis?: Kpi[], loading: boolean, expected: number }>()
const { t } = useI18n()
const fmt = useFormat()

const ICONS: Record<string, `i-lucide-${string}`> = {
  revenue: 'i-lucide-wallet',
  orders: 'i-lucide-shopping-cart',
  newUsers: 'i-lucide-user-plus',
  conversion: 'i-lucide-percent',
}

function display(k: Kpi): string {
  if (k.unit === 'currency') return fmt.currency(k.value, { compact: k.value >= 100_000 })
  if (k.unit === 'percent') return fmt.percent(k.value, 2)
  return fmt.number(k.value)
}

const cards = computed(() => (props.kpis ?? []).map(k => ({
  key: k.key,
  label: t(`dashboard.kpi.${k.key}`),
  value: display(k),
  icon: ICONS[k.key] ?? 'i-lucide-activity',
  delta: k.previous ? (k.value - k.previous) / k.previous : undefined,
  higherIsBetter: KPI_HIGHER_IS_BETTER[k.key] ?? true,
  trend: k.trend,
})))
</script>

<template>
  <div class="grid grid-cols-1 gap-(--app-gap) sm:grid-cols-2 xl:grid-cols-4">
    <template v-if="loading && !kpis">
      <AppStatCard
        v-for="i in expected"
        :key="i"
        label=""
        value=""
        icon="i-lucide-activity"
        loading
      />
    </template>
    <AppStatCard
      v-for="c in cards"
      v-else
      :key="c.key"
      :label="c.label"
      :value="c.value"
      :icon="c.icon"
      :delta="c.delta"
      :higher-is-better="c.higherIsBetter"
      :trend="c.trend"
      :data-testid="`kpi-${c.key}`"
    />
  </div>
</template>
