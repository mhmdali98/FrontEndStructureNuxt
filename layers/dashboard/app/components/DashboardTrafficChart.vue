<script setup lang="ts">
import type { TrafficItem } from '#layers/dashboard/shared/types/dashboard'

const props = defineProps<{ items?: TrafficItem[], loading: boolean, error: boolean }>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
const fmt = useFormat()

const data = computed(() => (props.items ?? []).map(i => ({ label: t(`dashboard.traffic.sources.${i.source}`), value: i.value })))
const total = computed(() => data.value.reduce((a, d) => a + d.value, 0))
</script>

<template>
  <AppChartCard
    :title="t('dashboard.traffic.title')"
    :description="t('dashboard.traffic.description')"
    :loading="loading && !items"
    :error="error && !items"
    :empty="!loading && !error && data.length === 0"
    @retry="$emit('retry')"
  >
    <UChart
      type="donut"
      :data="data"
      index="label"
      :categories="['value']"
      :format="(v: number) => fmt.compact(v)"
      :height="280"
      :thickness="28"
      :aria-label="t('dashboard.traffic.title')"
      :aria-description="t('dashboard.traffic.summary', { total: fmt.compact(total) })"
    >
      <template #center>
        <div class="text-center">
          <p class="text-xl font-semibold tabular-nums text-highlighted">
            {{ fmt.compact(total) }}
          </p>
          <p class="text-xs text-muted">
            {{ t('dashboard.traffic.visits') }}
          </p>
        </div>
      </template>
    </UChart>
  </AppChartCard>
</template>
