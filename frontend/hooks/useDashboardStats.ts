'use client';

import { gql } from '@apollo/client';
import { useQuery } from "@apollo/client/react";
import { DashboardStat } from './types';

const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats {
    dashboardStats {
      title
      value
      trend
      trendValue
    }
  }
`;

export default function useDashboardStats() {
  const { data, loading, error } = useQuery<{ dashboardStats: DashboardStat[] }>(
    DASHBOARD_STATS_QUERY
  );

  return {
    stats: data?.dashboardStats || [],
    loading,
    error: error?.message || null,
  };
}
