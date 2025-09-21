// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { DashboardStat } from './dashboard.model';

@Injectable()
export class DashboardService {
  async getDashboardStats(): Promise<DashboardStat[]> {
    return [
      { title: 'Users', value: 1200, trend: 'up', trendValue: '15%' },
      { title: 'Active Tasks', value: 75, trend: 'down', trendValue: '5%' },
      { title: 'Errors', value: 3, trend: 'up', trendValue: '1%' },
    ];
  }
}
