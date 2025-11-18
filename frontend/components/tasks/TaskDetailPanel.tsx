import { useState, useEffect } from 'react';
import type { Task } from '@/hooks/useTasks';

interface TaskLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
}

export default function TaskDetailPanel({ task, onClose }: Pick<TaskDetailPanelProps, 'task' | 'onClose'>) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'logs' | 'payload'>('details');

  // If no task is selected, show empty state
  if (!task) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">No task selected</p>
          <p className="text-sm">Select a task from the list to view details</p>
        </div>
      </div>
    );
  }

  // Fetch logs from REST API (since logs are not in GraphQL)
  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        // In production, this should use the proper API gateway URL
        const response = await fetch(
          `http://localhost:4001/api/tasks/${task.id}/logs?limit=50`
        );
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch {
        // Silently fail for now - logs are optional
      } finally {
        setLoadingLogs(false);
      }
    };

    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [task.id, activeTab]);

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'processing':
        return 'text-blue-600 dark:text-blue-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'cancelled':
        return 'text-gray-600 dark:text-gray-400';
      case 'retrying':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getLevelColor = (level: TaskLog['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Task Details</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {'Details'}
          </button>
          <button
            onClick={() => setActiveTab('payload')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'payload'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {'Payload'}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'logs'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {'Logs'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Task ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {'Task ID'}
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {task.id}
              </p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {'Type'}
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{task.type}</p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {'Status'}
              </label>
              <p className={`text-sm font-semibold uppercase ${getStatusColor(task.status)}`}>
                {task.status}
              </p>
            </div>

             {/* Timestamps */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {'Created At'}
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatDate(task.createdAt)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {'Updated At'}
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatDate(task.updatedAt)}
              </p>
            </div>

            {/* Error */}
            {task.error != null && (
              <div>
                <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                  {'Error'}
                </label>
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                  {task.error}
                </p>
              </div>
            )}

            {/* Result */}
            {task.result != null && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {'Result'}
                </label>
                <pre className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded overflow-x-auto">
                  {String(JSON.stringify(task.result, null, 2))}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payload' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {'Task Payload'}
            </label>
            <pre className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded overflow-x-auto">
              {String(JSON.stringify(task.payload, null, 2))}
            </pre>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {'Task Logs'} ({logs.length})
              </h3>
            </div>
            {loadingLogs ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                {'No logs available for this task.'}
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-semibold uppercase ${getLevelColor(log.level)}`}>
                        [{log.level}]
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100">{log.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(log.timestamp)}
                        </p>
                        {log.metadata != null && (
                          <pre className="text-xs text-gray-600 dark:text-gray-400 mt-2 overflow-x-auto">
                            {String(JSON.stringify(log.metadata, null, 2))}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
