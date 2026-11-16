import type { ApiClient } from '#layers/core/app/composables/useApiClient'
import type {
  ActivityItem, DashboardRange, DashboardSummary, OrdersPoint, RevenuePoint, TrafficItem,
} from '#layers/dashboard/shared/types/dashboard'

export function createDashboardApi(client: ApiClient) {
  return {
    summary: (range: DashboardRange, signal?: AbortSignal) => client.get<DashboardSummary>('/dashboard/summary', { query: { range }, signal }),
    revenue: (range: DashboardRange, signal?: AbortSignal) => client.get<{ points: RevenuePoint[] }>('/dashboard/revenue', { query: { range }, signal }),
    ordersByStatus: (range: DashboardRange, signal?: AbortSignal) => client.get<{ points: OrdersPoint[] }>('/dashboard/orders-by-status', { query: { range }, signal }),
    trafficSources: (range: DashboardRange, signal?: AbortSignal) => client.get<{ items: TrafficItem[] }>('/dashboard/traffic-sources', { query: { range }, signal }),
    activity: (limit: number, signal?: AbortSignal) => client.get<{ items: ActivityItem[] }>('/dashboard/activity', { query: { limit }, signal }),
  }
}
