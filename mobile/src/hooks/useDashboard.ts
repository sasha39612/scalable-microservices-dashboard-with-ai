import { useState, useEffect } from 'react';
import { DashboardStat, ApiResponse } from '../types/dashboard';

// Mock API service
const mockApiService = {
  getDashboardStats: (): Promise<DashboardStat[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const stats: DashboardStat[] = [
          {
            title: 'Active Users',
            value: '2,543',
            trend: 'up',
            trendValue: '12%',
            icon: 'people',
            color: '#4CAF50',
          },
          {
            title: 'Total Orders',
            value: '1,234',
            trend: 'up',
            trendValue: '8%',
            icon: 'shopping-cart',
            color: '#2196F3',
          },
          {
            title: 'Revenue',
            value: '$45,230',
            trend: 'up',
            trendValue: '15%',
            icon: 'attach-money',
            color: '#FF9800',
          },
          {
            title: 'Server Load',
            value: '67%',
            trend: 'down',
            trendValue: '5%',
            icon: 'memory',
            color: '#9C27B0',
          },
          {
            title: 'Response Time',
            value: '245ms',
            trend: 'down',
            trendValue: '3%',
            icon: 'speed',
            color: '#00BCD4',
          },
          {
            title: 'Error Rate',
            value: '0.2%',
            trend: 'down',
            trendValue: '0.1%',
            icon: 'error',
            color: '#F44336',
          },
        ];
        resolve(stats);
      }, 800);
    });
  },
};

export const useDashboardStats = (): ApiResponse<DashboardStat[]> => {
  const [data, setData] = useState<DashboardStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const stats = await mockApiService.getDashboardStats();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    data,
    loading,
    error,
  };
};

export const useChartData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock chart data
    setTimeout(() => {
      setData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            data: [20, 45, 28, 80, 99, 43],
            color: () => '#4CAF50',
            strokeWidth: 2,
          },
        ],
      });
      setLoading(false);
    }, 1000);
  }, []);

  return { data, loading };
};