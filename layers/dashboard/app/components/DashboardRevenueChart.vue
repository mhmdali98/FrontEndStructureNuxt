<script setup lang="ts">
import type { RevenuePoint } from '#layers/dashboard/shared/types/dashboard'

const props = defineProps<{ points?: RevenuePoint[], loading: boolean, error: boolean }>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
const fmt = useFormat()

const data = computed(() => (props.points ?? []).map(p => ({
  label: fmt.date(p.date, { month: 'short', day: 'numeric' }),
  revenue: p.revenue,
  expenses: p.expenses,
})))
const totals = computed(() => (props.points ?? []).reduce((a, p) => ({ r: a.r + p.revenue, e: a.e + p.expenses }), { r: 0, e: 0 }))
</script>

<template>
  <AppChartCard
    :title="t('dashboard.revenue.title')"
    :description="t('dashboard.revenue.description')"
    :loading="loading && !points"
    :error="error && !points"
    :empty="!loading && !error && data.length === 0"
    @retry="$emit('retry')"
  >
    <UChart
      type="area"
      :data="data"
      index="label"
      :categories="[{ key: 'revenue', label: t('dashboard.revenue.revenue') }, { key: 'expenses', label: t('dashboard.revenue.expenses') }]"
      :format="(v: number) => fmt.currency(v, { compact: true })"
      :height="280"
      curve="monotone"
      :aria-label="t('dashboard.revenue.title')"
      :aria-description="t('dashboard.revenue.summary', { revenue: fmt.currency(totals.r, { compact: true }), expenses: fmt.currency(totals.e, { compact: true }) })"
    />
  </AppChartCard>
</template>
