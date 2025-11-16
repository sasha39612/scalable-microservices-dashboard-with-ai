import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { DashboardService } from './dashboard.service';
import { DashboardStat, DashboardInsight, HistoricalTrends } from './dashboard.model';

@Resolver(() => DashboardStat)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => [DashboardStat], { description: 'Get aggregated dashboard statistics combining AI insights, job status, and historical data' })
  async dashboardStats(): Promise<DashboardStat[]> {
    return this.dashboardService.getDashboardStats();
  }

  @Query(() => [DashboardInsight], { description: 'Get AI-powered insights for the dashboard' })
  async dashboardInsights(): Promise<DashboardInsight[]> {
    return this.dashboardService.getDashboardInsights();
  }

  @Query(() => HistoricalTrends, { description: 'Get historical trends data for visualizations' })
  async dashboardTrends(
    @Args('days', { type: () => Int, nullable: true, defaultValue: 7 }) days: number,
  ): Promise<HistoricalTrends> {
    return this.dashboardService.getHistoricalTrends(days);
  }
}
