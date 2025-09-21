export interface DashboardStat {
  title: string;
  value: number | string;
  trend?: 'up' | 'down';
  trendValue?: number | string;
}
