'use client';

import React from 'react';
import { FiActivity } from 'react-icons/fi';
import StatsCard from '@/components/widgets/StatsCard';
import useDashboardStats from '@/hooks/useDashboardStats';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const DashboardPage = () => {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Error loading dashboard: {error}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your system metrics and performance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatsCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={<FiActivity size={24} />}
              trend={stat.trend}
              trendValue={stat.trendValue}
            />
          ))}
        </section>
      )}

      {/* Empty State */}
      {stats.length === 0 && (
        <section className="flex items-center justify-center h-64">
          <div className="text-center">
            <FiActivity size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">No data available</p>
          </div>
        </section>
      )}
    </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;
