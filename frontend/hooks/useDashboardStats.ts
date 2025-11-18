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
    DASHBOARD_STATS_QUERY,
    {
      errorPolicy: 'all'
    }
  );

  // Log errors and data for debugging
  if (error) {
    // eslint-disable-next-line no-console
    console.error('GraphQL Error in useDashboardStats:', error);
    // Safely access error properties
    if ('networkError' in error && error.networkError) {
      // eslint-disable-next-line no-console
      console.error('Network Error:', error.networkError);
    }
    if ('graphQLErrors' in error && error.graphQLErrors) {
      // eslint-disable-next-line no-console
      console.error('GraphQL Errors:', error.graphQLErrors);
    }
  }

  if (data) {
    // eslint-disable-next-line no-console
    console.log('Dashboard stats loaded successfully:', data);
  }

  return {
    stats: data?.dashboardStats || [],
    loading,
    error: error?.message || null,
  };
}
