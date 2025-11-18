'use client';

import { gql } from '@apollo/client';
import { useQuery } from "@apollo/client/react";

// GraphQL Queries
const DASHBOARD_INSIGHTS_QUERY = gql`
  query DashboardInsights {
    dashboardInsights {
      id
      type
      title
      description
      data
      confidence
      recommendations
      createdAt
    }
  }
`;

const DASHBOARD_TRENDS_QUERY = gql`
  query DashboardTrends($days: Int) {
    dashboardTrends(days: $days) {
      period
      taskCompletionTrend {
        day
        completed
        failed
      }
      userGrowthTrend {
        day
        users
      }
    }
  }
`;

// Types
export interface DashboardInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  data?: Record<string, unknown>;
  confidence?: number;
  recommendations?: string[];
  createdAt: string;
}

export interface TrendDataPoint {
  day: number;
  completed?: number;
  failed?: number;
  users?: number;
}

export interface HistoricalTrends {
  period: string;
  taskCompletionTrend: TrendDataPoint[];
  userGrowthTrend: TrendDataPoint[];
}

// Hook for Dashboard Insights
export function useDashboardInsights() {
  const { data, loading, error } = useQuery<{ dashboardInsights: DashboardInsight[] }>(
    DASHBOARD_INSIGHTS_QUERY,
    {
      errorPolicy: 'all'
    }
  );

  return {
    insights: data?.dashboardInsights || [],
    loading,
    error: error?.message || null,
  };
}

// Hook for Dashboard Trends
export function useDashboardTrends(days: number = 7) {
  const { data, loading, error } = useQuery<{ dashboardTrends: HistoricalTrends }>(
    DASHBOARD_TRENDS_QUERY,
    {
      variables: { days },
      errorPolicy: 'all'
    }
  );

  return {
    trends: data?.dashboardTrends,
    loading,
    error: error?.message || null,
  };
}

// Hook for Analytics Data (combines insights and trends)
export function useAnalyticsData(days: number = 7) {
  const insights = useDashboardInsights();
  const trends = useDashboardTrends(days);

  return {
    insights: insights.insights,
    trends: trends.trends,
    loading: insights.loading || trends.loading,
    error: insights.error || trends.error,
  };
}