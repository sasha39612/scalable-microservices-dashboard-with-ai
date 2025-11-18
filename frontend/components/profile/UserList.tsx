'use client';

import { User, useUsers } from '@/hooks/useUser';

interface UserListProps {
  onUserSelect?: (user: User) => void;
  selectedUserId?: string;
}

export default function UserList({ onUserSelect, selectedUserId }: UserListProps) {
  const { users, loading, error } = useUsers();

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠ Error loading users</div>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Users</h3>
      
      {users.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">👥</div>
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => onUserSelect?.(user)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedUserId === user.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}