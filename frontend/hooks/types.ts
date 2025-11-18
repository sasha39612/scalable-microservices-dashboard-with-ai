export interface DashboardStat {
  title: string;
  value: number | string;
  trend?: 'up' | 'down';
  trendValue?: number | string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}
