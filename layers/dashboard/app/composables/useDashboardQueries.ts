import type { Ref } from 'vue'
import type { DashboardRange } from '#layers/dashboard/shared/types/dashboard'
import { createDashboardApi } from '../api/dashboard.api'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (range: DashboardRange) => ['dashboard', 'summary', range] as const,
  revenue: (range: DashboardRange) => ['dashboard', 'revenue', range] as const,
  orders: (range: DashboardRange) => ['dashboard', 'orders', range] as const,
  traffic: (range: DashboardRange) => ['dashboard', 'traffic', range] as const,
  activity: ['dashboard', 'activity'] as const,
}

/** One query per widget; each is enabled only when the user may see that widget. */
export function useDashboardQueries(range: Ref<DashboardRange>) {
  const api = createDashboardApi(useApiClient())
  const { can, canAny } = usePermissions()

  const summary = useQuery({
    key: () => dashboardKeys.summary(range.value),
    query: ({ signal }) => api.summary(range.value, signal),
    enabled: () => canAny(['dashboard.view', 'reports.view']),
    placeholderData: prev => prev,
  })
  const revenue = useQuery({
    key: () => dashboardKeys.revenue(range.value),
    query: ({ signal }) => api.revenue(range.value, signal),
    enabled: () => can('reports.view'),
    placeholderData: prev => prev,
  })
  const traffic = useQuery({
    key: () => dashboardKeys.traffic(range.value),
    query: ({ signal }) => api.trafficSources(range.value, signal),
    enabled: () => can('dashboard.view'),
    placeholderData: prev => prev,
  })

  return { summary, revenue, traffic, api }
}

export function useDashboardOrdersQuery(range: Ref<DashboardRange>) {
  const api = createDashboardApi(useApiClient())
  return useQuery({
    key: () => dashboardKeys.orders(range.value),
    query: ({ signal }) => api.ordersByStatus(range.value, signal),
    placeholderData: prev => prev,
  })
}

export function useDashboardActivityQuery() {
  const api = createDashboardApi(useApiClient())
  return useQuery({
    key: dashboardKeys.activity,
    query: ({ signal }) => api.activity(8, signal),
  })
}

/** KPIs where a lower value is better (none today; e.g. churn or refunds would be). */
export const KPI_HIGHER_IS_BETTER: Record<string, boolean> = {
  revenue: true,
  orders: true,
  newUsers: true,
  conversion: true,
}
