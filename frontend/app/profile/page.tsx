'use client';

import { useState } from 'react';
import { User, useUser } from '@/hooks/useUser';
import ProfileDisplay from '@/components/profile/ProfileDisplay';
import ProfileForm from '@/components/profile/ProfileForm';
import UserList from '@/components/profile/UserList';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type ViewMode = 'list' | 'view' | 'create' | 'edit';

const ProfilePage = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  const { user, loading, error, refetch } = useUser(selectedUserId || undefined);

  const handleUserSelect = (user: User) => {
    setSelectedUserId(user.id);
    setViewMode('view');
  };

  const handleCreateUser = () => {
    setSelectedUserId(null);
    setViewMode('create');
  };

  const handleEditUser = () => {
    setViewMode('edit');
  };

  const handleUserCreated = (newUser: User) => {
    setSelectedUserId(newUser.id);
    setViewMode('view');
  };

  const handleCancel = () => {
    setViewMode(selectedUserId ? 'view' : 'list');
  };

  const handleBackToList = () => {
    setSelectedUserId(null);
    setViewMode('list');
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Profile Management</h1>
        <p className="text-gray-600">Manage user profiles and information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Navigation and Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setViewMode('list')}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                View All Users
              </button>
              <button
                onClick={handleCreateUser}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  viewMode === 'create'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Create New User
              </button>
              {selectedUserId && (
                <button
                  onClick={handleBackToList}
                  className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  ← Back to List
                </button>
              )}
            </div>
          </div>

          {/* Show user list when in list mode or when no user is selected */}
          {(viewMode === 'list' || !selectedUserId) && (
            <UserList 
              onUserSelect={handleUserSelect}
              selectedUserId={selectedUserId || undefined}
            />
          )}
        </div>

        {/* Right Column - Main Content */}
        <div className="lg:col-span-2">
          {viewMode === 'list' && !selectedUserId && (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-gray-400 mb-4 text-6xl">👤</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Select a User</h2>
              <p className="text-gray-600 mb-6">
                Choose a user from the list to view their profile, or create a new user.
              </p>
            </div>
          )}

          {viewMode === 'view' && user && (
            <ProfileDisplay 
              user={user}
              onEdit={handleEditUser}
            />
          )}

          {viewMode === 'view' && loading && (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2 mx-auto w-32"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 mx-auto w-48"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'view' && error && (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-red-600 mb-2">⚠ Error loading user</div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => refetch()}
                className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          )}

          {(viewMode === 'create' || viewMode === 'edit') && (
            <ProfileForm
              user={viewMode === 'edit' ? user : null}
              onUserCreated={handleUserCreated}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;