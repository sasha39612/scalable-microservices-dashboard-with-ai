// api-gateway/tests/resolvers/dashboard.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardResolver } from '../../src/modules/dashboard/dashboard.resolver';
import { DashboardService } from '../../src/modules/dashboard/dashboard.service';
import { DashboardStat } from '../../src/modules/dashboard/dashboard.model';

describe('DashboardResolver', () => {
  let resolver: DashboardResolver;
  let service: DashboardService;

  const mockStats: DashboardStat[] = [
    { title: 'Users Count', value: 120, trend: 'up', trendValue: '10%' },
    { title: 'Active Sessions', value: 15, trend: 'down', trendValue: '5%' },
    { title: 'Revenue', value: 5020, trend: 'up', trendValue: '8%' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardResolver,
        {
          provide: DashboardService,
          useValue: {
            getDashboardStats: jest.fn().mockResolvedValue(mockStats),
          },
        },
      ],
    }).compile();

    resolver = module.get<DashboardResolver>(DashboardResolver);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should return an array of dashboard stats', async () => {
    const result = await resolver.dashboardStats();

    expect(result).toEqual(mockStats);
    expect(service.getDashboardStats).toHaveBeenCalledTimes(1);

    result.forEach((stat) => {
      expect(typeof stat.title).toBe('string');
      expect(typeof stat.value).toBe('number');
      if (stat.trend) expect(['up', 'down']).toContain(stat.trend);
      if (stat.trendValue) expect(typeof stat.trendValue).toBe('string');
    });
  });
});
