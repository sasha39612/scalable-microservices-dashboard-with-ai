'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from "@apollo/client/react";

// Define interfaces
export interface ChatMessage {
  message: string;
  role: 'user' | 'assistant' | 'system';
  conversationId?: string;
  tokensUsed?: number;
  model?: string;
  timestamp: string;
}

export interface ChatRequestInput {
  message: string;
  conversationId?: string;
  model?: string;
  systemPrompt?: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  category: string;
  confidence: number;
  actionable: boolean;
  timestamp: string;
}

export interface InsightRequestInput {
  dataType: string;
  timeRange?: string;
  filters?: Record<string, unknown>;
}

export interface AnalysisResponse {
  insights: Insight[];
  summary: string;
  recommendations: string[];
}

export interface AnalysisRequestInput {
  data: Record<string, unknown>;
  analysisType: string;
}

// GraphQL Operations
const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($input: ChatRequestInput!) {
    chat(input: $input) {
      message
      role
      conversationId
      tokensUsed
      model
      timestamp
    }
  }
`;

const GET_INSIGHTS = gql`
  query GetInsights($input: InsightRequestInput!) {
    insights(input: $input) {
      id
      title
      description
      category
      confidence
      actionable
      timestamp
    }
  }
`;

const REQUEST_ANALYSIS = gql`
  mutation RequestAnalysis($input: AnalysisRequestInput!) {
    analyze(input: $input) {
      insights {
        id
        title
        description
        category
        confidence
        actionable
        timestamp
      }
      summary
      recommendations
    }
  }
`;

const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($input: RecommendationsRequestInput!) {
    recommendations(input: $input) {
      recommendations
      reasoning
      confidence
      category
      timestamp
    }
  }
`;

const GET_SUMMARY = gql`
  query GetSummary($input: SummaryRequestInput!) {
    summary(input: $input) {
      summary
      keyPoints
      confidence
      timestamp
    }
  }
`;

// Custom hooks
export function useChatMessage() {
  const [sendMessage, { loading, error }] = useMutation<{ chat: ChatMessage }>(
    SEND_CHAT_MESSAGE
  );

  const chat = async (input: ChatRequestInput) => {
    const result = await sendMessage({
      variables: { input },
    });
    return result.data?.chat;
  };

  return {
    chat,
    loading,
    error: error?.message || null,
  };
}

export function useInsights(input: InsightRequestInput) {
  const { data, loading, error, refetch } = useQuery<{ insights: Insight[] }>(
    GET_INSIGHTS,
    {
      variables: { input },
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    insights: data?.insights || [],
    loading,
    error: error?.message || null,
    refetch,
  };
}

export function useAnalysis() {
  const [requestAnalysis, { loading, error }] = useMutation<{ analyze: AnalysisResponse }>(
    REQUEST_ANALYSIS
  );

  const analyze = async (input: AnalysisRequestInput) => {
    const result = await requestAnalysis({
      variables: { input },
    });
    return result.data?.analyze;
  };

  return {
    analyze,
    loading,
    error: error?.message || null,
  };
}

export function useRecommendations(input: Record<string, unknown>) {
  const { data, loading, error, refetch } = useQuery<{recommendations: unknown}>(
    GET_RECOMMENDATIONS,
    {
      variables: { input },
      fetchPolicy: 'cache-and-network',
      skip: !input,
    }
  );

  return {
    recommendations: data?.recommendations || null,
    loading,
    error: error?.message || null,
    refetch,
  };
}

export function useSummary(input: Record<string, unknown>) {
  const { data, loading, error, refetch } = useQuery<{summary: unknown}>(
    GET_SUMMARY,
    {
      variables: { input },
      fetchPolicy: 'cache-and-network',
      skip: !input,
    }
  );

  return {
    summary: data?.summary || null,
    loading,
    error: error?.message || null,
    refetch,
  };
}