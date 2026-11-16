<script setup lang="ts">
import type { DashboardRange } from '#layers/dashboard/shared/types/dashboard'
import { dashboardKeys, useDashboardQueries } from '../composables/useDashboardQueries'

definePageMeta({ permissions: ['dashboard.view'], titleKey: 'dashboard.title' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { can } = usePermissions()
const queryCache = useQueryCache()

const RANGES: DashboardRange[] = ['7d', '30d', '90d']
const range = computed<DashboardRange>({
  get: () => RANGES.includes(route.query.range as DashboardRange) ? route.query.range as DashboardRange : '30d',
  set: v => void router.replace({ query: { ...route.query, range: v } }),
})

const { summary, revenue, traffic } = useDashboardQueries(range)

const greeting = computed(() => {
  const h = new Date().getHours()
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return t(`common.greeting.${part}`, { name: auth.user?.name.split(' ')[0] ?? '' })
})

const showRevenue = computed(() => can('reports.view'))
const showTraffic = computed(() => can('dashboard.view'))
const showOrders = computed(() => can('dashboard.view'))
const showActivity = computed(() => can('users.view'))
const expectedKpis = computed(() => (can('reports.view') ? 1 : 0) + (can('dashboard.view') ? 3 : 0))

const lowerRow = useTemplateRef('lowerRow')
const lowerVisible = useElementVisibility(lowerRow)
const lowerMounted = ref(false)
watch(lowerVisible, (v) => {
  if (v) lowerMounted.value = true
}, { immediate: true })

const refreshing = ref(false)
async function refresh(): Promise<void> {
  refreshing.value = true
  await queryCache.invalidateQueries({ key: dashboardKeys.all })
  refreshing.value = false
}
</script>

<template>
  <div class="flex flex-col gap-(--app-gap)">
    <AppPageHeader
      :title="greeting"
      :description="t('dashboard.subtitle')"
    >
      <template #actions>
        <UTabs
          v-model="range"
          :items="RANGES.map(r => ({ label: t(`dashboard.ranges.${r}`), value: r }))"
          :content="false"
          size="sm"
          color="neutral"
          :aria-label="t('dashboard.rangeLabel')"
        />
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          :loading="refreshing"
          :aria-label="t('common.refresh')"
          square
          @click="refresh"
        />
      </template>
    </AppPageHeader>

    <NuxtErrorBoundary>
      <DashboardKpis
        v-if="expectedKpis > 0"
        :kpis="summary.data.value?.kpis"
        :loading="summary.isLoading.value"
        :expected="expectedKpis"
      />
      <AppInlineError
        v-if="summary.error.value && !summary.data.value"
        @retry="summary.refetch()"
      />
      <template #error="{ clearError }">
        <AppInlineError @retry="clearError" />
      </template>
    </NuxtErrorBoundary>

    <div
      v-if="showRevenue || showTraffic"
      class="grid gap-(--app-gap) lg:grid-cols-3"
    >
      <NuxtErrorBoundary v-if="showRevenue">
        <DashboardRevenueChart
          :class="showTraffic ? 'lg:col-span-2' : 'lg:col-span-3'"
          :points="revenue.data.value?.points"
          :loading="revenue.isLoading.value"
          :error="!!revenue.error.value"
          @retry="revenue.refetch()"
        />
        <template #error="{ clearError }">
          <AppInlineError @retry="clearError" />
        </template>
      </NuxtErrorBoundary>
      <NuxtErrorBoundary v-if="showTraffic">
        <DashboardTrafficChart
          :class="showRevenue ? '' : 'lg:col-span-3'"
          :items="traffic.data.value?.items"
          :loading="traffic.isLoading.value"
          :error="!!traffic.error.value"
          @retry="traffic.refetch()"
        />
        <template #error="{ clearError }">
          <AppInlineError @retry="clearError" />
        </template>
      </NuxtErrorBoundary>
    </div>

    <div
      v-if="showOrders || showActivity"
      ref="lowerRow"
      class="grid min-h-80 gap-(--app-gap) lg:grid-cols-2"
    >
      <template v-if="lowerMounted">
        <NuxtErrorBoundary v-if="showOrders">
          <LazyDashboardOrdersChart
            :class="showActivity ? '' : 'lg:col-span-2'"
            :range="range"
          />
          <template #error="{ clearError }">
            <AppInlineError @retry="clearError" />
          </template>
        </NuxtErrorBoundary>
        <NuxtErrorBoundary v-if="showActivity">
          <LazyDashboardActivity :class="showOrders ? '' : 'lg:col-span-2'" />
          <template #error="{ clearError }">
            <AppInlineError @retry="clearError" />
          </template>
        </NuxtErrorBoundary>
      </template>
    </div>
  </div>
</template>
