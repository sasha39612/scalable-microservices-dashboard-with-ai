import { Resolver, Query } from '@nestjs/graphql';
import { DashboardService } from './dashboard.service';
import { DashboardStat } from './dashboard.model';

@Resolver(() => DashboardStat)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => [DashboardStat])
  async dashboardStats(): Promise<DashboardStat[]> {
    return this.dashboardService.getDashboardStats();
  }
}
