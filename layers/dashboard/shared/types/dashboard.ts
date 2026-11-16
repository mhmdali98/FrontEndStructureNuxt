export type DashboardRange = '7d' | '30d' | '90d'
export type KpiKey = 'revenue' | 'orders' | 'newUsers' | 'conversion'

export interface Kpi {
  key: KpiKey
  value: number
  previous: number
  unit: 'currency' | 'number' | 'percent'
  trend: number[]
}

export interface DashboardSummary { kpis: Kpi[] }
export interface RevenuePoint { date: string, revenue: number, expenses: number }
export interface OrdersPoint { date: string, pending: number, completed: number, cancelled: number }
export type TrafficSource = 'direct' | 'search' | 'social' | 'referral' | 'email'
export interface TrafficItem { source: TrafficSource, value: number }

export type ActivityType = 'user.created' | 'user.updated' | 'user.deleted' | 'role.updated' | 'auth.login'
export interface ActivityItem {
  id: string
  type: ActivityType
  actor: { id: string, name: string, avatarUrl: string | null }
  target?: { type: string, id: string, label: string }
  createdAt: string
}
