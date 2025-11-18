'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import TaskTable from '@/components/tasks/TaskTable';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';

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

const CANCEL_TASK = gql`
  mutation CancelTask($taskId: String!) {
    cancelTask(taskId: $taskId)
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

interface TasksResponse {
  tasks: {
    tasks: Task[];
    total: number;
  };
}

export default function TasksPage() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    limit: 50,
    offset: 0,
  });

  // Query tasks with filters
  const { data, loading, error, refetch } = useQuery<TasksResponse>(GET_TASKS, {
    variables: { filters },
    pollInterval: 5000, // Poll every 5 seconds for updates
  });

  // Cancel task mutation
  const [cancelTask] = useMutation(CANCEL_TASK, {
    onCompleted: () => {
      refetch();
    },
    onError: (err: Error) => {
      console.error('Failed to cancel task:', err);
    },
  });

  // Create task mutation
  const [createTask] = useMutation(CREATE_TASK, {
    onCompleted: () => {
      refetch();
    },
    onError: (err: Error) => {
      console.error('Failed to create task:', err);
    },
  });

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status, offset: 0 });
  };

  const handleTypeFilter = (type: string) => {
    setFilters({ ...filters, type, offset: 0 });
  };

  const handleClearFilters = () => {
    setFilters({ status: '', type: '', limit: 50, offset: 0 });
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCancelTask = async (taskId: string) => {
    if (confirm('Are you sure you want to cancel this task?')) {
      await cancelTask({ variables: { taskId } });
    }
  };

  const handleClosePanel = () => {
    setSelectedTask(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handlePageChange = (newOffset: number) => {
    setFilters({ ...filters, offset: newOffset });
  };

  const tasks = data?.tasks.tasks || [];
  const total = data?.tasks.total || 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tasks & Jobs</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {'Monitor and manage background tasks and scheduled jobs'}
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{'All Statuses'}</option>
              <option value="pending">{'Pending'}</option>
              <option value="processing">{'Processing'}</option>
              <option value="completed">{'Completed'}</option>
              <option value="failed">{'Failed'}</option>
              <option value="cancelled">{'Cancelled'}</option>
              <option value="retrying">{'Retrying'}</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{'All Types'}</option>
              <option value="email">{'Email'}</option>
              <option value="data-sync">{'Data Sync'}</option>
              <option value="cleanup">{'Cleanup'}</option>
              <option value="report">{'Report'}</option>
              <option value="backup">{'Backup'}</option>
            </select>
          </div>

          <div className="flex gap-2 items-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {'Clear Filters'}
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {'Refresh'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {`Showing ${tasks.length} of ${total} tasks`}
            {`${filters.status} ? • Status: ${filters.status} : ''`}
            {`${filters.type ? ` • Type: ${filters.type}` : ''}`}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Table */}
        <div className={selectedTask ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <TaskTable
            tasks={tasks}
            loading={loading}
            error={error}
            onTaskSelect={handleTaskSelect}
            onCancelTask={handleCancelTask}
            selectedTaskId={selectedTask?.id}
            currentOffset={filters.offset}
            limit={filters.limit}
            total={total}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Task Detail Panel */}
        {selectedTask && (
          <div className="lg:col-span-1">
            <TaskDetailPanel
              task={selectedTask}
              onClose={handleClosePanel}
              onRefresh={refetch}
            />
          </div>
        )}
      </div>
    </div>
  );
}
