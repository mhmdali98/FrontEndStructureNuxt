<script setup lang="ts">
import type { DashboardRange } from '#layers/dashboard/shared/types/dashboard'
import { useDashboardOrdersQuery } from '../composables/useDashboardQueries'

const props = defineProps<{ range: DashboardRange }>()
const { t } = useI18n()
const fmt = useFormat()
const range = toRef(props, 'range')
const { data, isLoading, error, refetch } = useDashboardOrdersQuery(range)

const points = computed(() => {
  const list = data.value?.points ?? []
  // Group into at most ~15 bars so long ranges stay readable.
  const size = Math.max(1, Math.ceil(list.length / 15))
  const out: { label: string, pending: number, completed: number, cancelled: number }[] = []
  for (let i = 0; i < list.length; i += size) {
    const chunk = list.slice(i, i + size)
    out.push({
      label: fmt.date(chunk[0]!.date, { month: 'short', day: 'numeric' }),
      completed: chunk.reduce((a, p) => a + p.completed, 0),
      pending: chunk.reduce((a, p) => a + p.pending, 0),
      cancelled: chunk.reduce((a, p) => a + p.cancelled, 0),
    })
  }
  return out
})
</script>

<template>
  <AppChartCard
    :title="t('dashboard.orders.title')"
    :description="t('dashboard.orders.description')"
    :loading="isLoading && !data"
    :error="!!error && !data"
    :empty="!isLoading && !error && points.length === 0"
    @retry="refetch()"
  >
    <UChart
      type="bar"
      stacked
      :data="points"
      index="label"
      :categories="[
        { key: 'completed', label: t('dashboard.orders.completed'), color: 'success' },
        { key: 'pending', label: t('dashboard.orders.pending'), color: 'warning' },
        { key: 'cancelled', label: t('dashboard.orders.cancelled'), color: 'error' },
      ]"
      :format="(v: number) => fmt.number(v)"
      :height="280"
      :aria-label="t('dashboard.orders.title')"
    />
  </AppChartCard>
</template>
