'use client';

import { gql } from '@apollo/client';
import { useQuery, useMutation } from "@apollo/client/react";

// Define the Task interface
export interface Task {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying';
  payload: Record<string, unknown>;
  result?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
}

export interface CreateTaskInput {
  type: string;
  payload: Record<string, unknown>;
}

// GraphQL Queries and Mutations
const GET_TASKS = gql`
  query GetTasks($filters: TaskFiltersInput) {
    tasks(filters: $filters) {
      tasks {
        id
        type
        status
        payload
        result
        error
        createdAt
        updatedAt
      }
      total
    }
  }
`;

const GET_TASK = gql`
  query GetTask($taskId: String!) {
    task(taskId: $taskId) {
      id
      type
      status
      payload
      result
      error
      createdAt
      updatedAt
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      type
      status
      payload
      createdAt
    }
  }
`;

const CANCEL_TASK = gql`
  mutation CancelTask($taskId: String!) {
    cancelTask(taskId: $taskId)
  }
`;

const RETRY_TASK = gql`
  mutation RetryTask($taskId: String!, $resetAttempts: Boolean) {
    retryTask(taskId: $taskId, resetAttempts: $resetAttempts) {
      id
      type
      status
      payload
      result
      error
      createdAt
      updatedAt
    }
  }
`;

// Custom hooks
export function useTasks(filters?: TaskFilters) {
  const { data, loading, error, refetch } = useQuery<{ tasks: TasksResponse }>(
    GET_TASKS,
    {
      variables: { filters },
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    tasks: data?.tasks?.tasks || [],
    total: data?.tasks?.total || 0,
    loading,
    error: error?.message || null,
    refetch,
  };
}

export function useTask(taskId: string) {
  const { data, loading, error } = useQuery<{ task: Task }>(
    GET_TASK,
    {
      variables: { taskId },
      skip: !taskId,
    }
  );

  return {
    task: data?.task || null,
    loading,
    error: error?.message || null,
  };
}

export function useCreateTask() {
  const [createTaskMutation, { loading, error }] = useMutation<{ createTask: Task }>(
    CREATE_TASK
  );

  const createTask = async (input: CreateTaskInput) => {
    const result = await createTaskMutation({
      variables: { input },
    });
    return result.data?.createTask;
  };

  return {
    createTask,
    loading,
    error: error?.message || null,
  };
}

export function useCancelTask() {
  const [cancelTaskMutation, { loading, error }] = useMutation<{ cancelTask: boolean }>(
    CANCEL_TASK
  );

  const cancelTask = async (taskId: string) => {
    const result = await cancelTaskMutation({
      variables: { taskId },
    });
    return result.data?.cancelTask;
  };

  return {
    cancelTask,
    loading,
    error: error?.message || null,
  };
}

export function useRetryTask() {
  const [retryTaskMutation, { loading, error }] = useMutation<{ retryTask: Task }>(
    RETRY_TASK
  );

  const retryTask = async (taskId: string, resetAttempts?: boolean) => {
    const result = await retryTaskMutation({
      variables: { taskId, resetAttempts },
    });
    return result.data?.retryTask;
  };

  return {
    retryTask,
    loading,
    error: error?.message || null,
  };
}