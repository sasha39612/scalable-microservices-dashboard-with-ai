'use client';

import React from 'react';
import { FiTrendingUp, FiUsers, FiTarget, FiBarChart } from 'react-icons/fi';
import StatsCard from '@/components/widgets/StatsCard';
import Charts from '@/components/analytics/Charts';
import useDashboardStats from '@/hooks/useDashboardStats';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const AnalyticsPage = () => {
  const { stats, loading, error } = useDashboardStats();

  // Sample KPI data - in a real app, this would come from an API
  const kpiData = [
    {
      title: 'Revenue Growth',
      value: '24.5%',
      icon: <FiTrendingUp size={24} />,
      trend: 'up' as const,
      trendValue: '+5.2% vs last month'
    },
    {
      title: 'Active Users',
      value: '12.8K',
      icon: <FiUsers size={24} />,
      trend: 'up' as const,
      trendValue: '+18% vs last month'
    },
    {
      title: 'Conversion Rate',
      value: '8.9%',
      icon: <FiTarget size={24} />,
      trend: 'down' as const,
      trendValue: '-2.1% vs last month'
    },
    {
      title: 'Performance Score',
      value: '94/100',
      icon: <FiBarChart size={24} />,
      trend: 'up' as const,
      trendValue: '+7 points'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Error loading analytics: {error}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {'Monitor your key performance indicators and trends'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            {'Export Data'}
          </button>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {'Date Range'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <StatsCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
            trendValue={kpi.trendValue}
          />
        ))}
      </section>

      {/* System Stats */}
      {stats.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {'System Metrics'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <StatsCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                trend={stat.trend}
                trendValue={stat.trendValue}
              />
            ))}
          </div>
        </section>
      )}

      {/* Charts Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {'Performance Trends'}
        </h2>
        <Charts />
      </section>
    </div>
    </ProtectedRoute>
  );
};

export default AnalyticsPage;