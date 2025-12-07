export interface DashboardStat {
  title: string;
  value: number | string;
  trend?: 'up' | 'down';
  trendValue?: number | string;
  icon: string;
  color: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: () => string;
    strokeWidth?: number;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  loading: boolean;
}

export interface UserStats {
  activeUsers: number;
  newUsers: number;
  userGrowthRate: number;
}

export interface SystemStats {
  serverLoad: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

export interface BusinessStats {
  totalOrders: number;
  revenue: number;
  conversionRate: number;
  avgOrderValue: number;
}