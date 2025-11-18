'use client';

import { User } from '@/hooks/types';

interface ProfileDisplayProps {
  user: User;
  onEdit?: () => void;
}

export default function ProfileDisplay({ user, onEdit }: ProfileDisplayProps) {
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
        <p className="text-gray-600">{user.email}</p>
      </div>

      <div className="space-y-4">
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Profile Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">User ID:</span>
              <span className="text-sm text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">
                {user.id}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <span className="text-sm text-gray-800">{user.name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <span className="text-sm text-gray-800">{user.email}</span>
            </div>
          </div>
        </div>

        {onEdit && (
          <div className="pt-4">
            <button
              onClick={onEdit}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}