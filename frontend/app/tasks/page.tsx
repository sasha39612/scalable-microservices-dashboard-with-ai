'use client';

import { useState } from 'react';
import TaskTable from '@/components/tasks/TaskTable';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import { useTasks, useCreateTask, useCancelTask, type Task, type TaskFilters } from '@/hooks/useTasks';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TasksPage() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    status: '',
    type: '',
    limit: 50,
    offset: 0,
  });

  const { tasks, total, loading, error, refetch } = useTasks(filters);
  const { createTask, loading: creating } = useCreateTask();
  const { cancelTask } = useCancelTask();

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status, offset: 0 });
  };

  const handleTypeFilter = (type: string) => {
    setFilters({ ...filters, type, offset: 0 });
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await cancelTask(taskId);
      refetch();
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch {
      // Handle error silently or use proper error reporting
    }
  };

  const handleCreateTask = async (type: string, payload: Record<string, unknown>) => {
    try {
      await createTask({ type, payload });
      refetch();
    } catch {
      // Handle error silently or use proper error reporting
    }
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
  };

  const handlePagination = (offset: number) => {
    setFilters({ ...filters, offset });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">Error loading tasks: {error}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage background tasks and jobs
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => handleCreateTask('test-task', { message: 'Test task' })}
            disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Test Task'}
          </button>
          <button 
            onClick={() => refetch()}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex space-x-4">
        <select
          value={filters.status || ''}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="retrying">Retrying</option>
        </select>
        <select
          value={filters.type || ''}
          onChange={(e) => handleTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        >
          <option value="">All Types</option>
          <option value="email">Email</option>
          <option value="report">Report</option>
          <option value="backup">Backup</option>
          <option value="import">Import</option>
          <option value="export">Export</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskTable
            tasks={tasks}
            total={total}
            loading={loading}
            onTaskSelect={handleTaskSelect}
            onCancelTask={handleCancelTask}
            onPageChange={handlePagination}
            currentOffset={filters.offset || 0}
            limit={filters.limit || 50}
            selectedTaskId={selectedTask?.id}
          />
        </div>

        <div className="lg:col-span-1">
          <TaskDetailPanel
            task={selectedTask}
            onClose={handleCloseDetail}
          />
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
