# Profile Page Implementation

This document describes the complete implementation of the Profile Page that connects to the backend microservices architecture.

## Overview

The Profile Page provides a comprehensive user management interface that allows users to:
- View a list of all users
- View detailed user profiles
- Create new user accounts
- Edit existing user information (coming soon)

## Architecture

### Frontend Components

#### 1. **Profile Page** (`/app/profille/page.tsx`)
The main page component that orchestrates the entire user management experience:
- **State Management**: Manages view modes (list, view, create, edit)
- **User Selection**: Handles selection of users from the list
- **Navigation**: Provides seamless navigation between different views
- **Responsive Design**: Grid layout that adapts to different screen sizes

#### 2. **useUser Hook** (`/hooks/useUser.ts`)
Custom React hook that manages GraphQL operations for users:
- `useUser(id)`: Fetches a single user by ID
- `useUsers()`: Fetches all users
- `useCreateUser()`: Creates a new user account
- **Error Handling**: Comprehensive error handling and loading states
- **Type Safety**: Full TypeScript integration

#### 3. **ProfileDisplay Component** (`/components/profile/ProfileDisplay.tsx`)
Displays user profile information in a clean, card-based layout:
- **Avatar Generation**: Creates colored avatars with user initials
- **Information Layout**: Organized display of user data
- **Action Buttons**: Edit functionality (expandable)

#### 4. **ProfileForm Component** (`/components/profile/ProfileForm.tsx`)
Form component for creating and editing user profiles:
- **Validation**: Client-side validation for all fields
- **Error Display**: User-friendly error messages
- **Loading States**: Visual feedback during form submission
- **Dual Mode**: Supports both create and edit operations

#### 5. **UserList Component** (`/components/profile/UserList.tsx`)
List view of all users with selection capabilities:
- **Loading States**: Skeleton loading animation
- **Empty States**: Helpful messaging when no users exist
- **Selection Feedback**: Visual indication of selected user
- **Error Handling**: Graceful error display

### Backend Integration

#### GraphQL Schema
The frontend integrates with the following GraphQL operations:

```graphql
# Queries
query GetUser($id: String!) {
  user(id: $id) {
    id
    email
    name
  }
}

query GetUsers {
  users {
    id
    email
    name
  }
}

# Mutations
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
    name
  }
}
```

#### Backend Services
- **API Gateway**: GraphQL endpoint that handles all user operations
- **User Service**: Manages user data and business logic
- **Common Types**: Shared TypeScript types between services

## Features

### Current Features
✅ **View All Users**: Browse all registered users in a clean list format
✅ **User Details**: View comprehensive user profile information
✅ **Create Users**: Add new users with validation
✅ **Error Handling**: Comprehensive error handling throughout
✅ **Loading States**: Visual feedback for all async operations
✅ **Responsive Design**: Works on all screen sizes
✅ **Type Safety**: Full TypeScript integration

### Planned Features
🔄 **Edit User Profiles**: Modify existing user information
🔄 **Delete Users**: Remove users from the system
🔄 **User Search**: Search and filter users
🔄 **Profile Pictures**: Upload and manage profile images
🔄 **Activity History**: View user activity and login history
🔄 **Permissions**: Role-based access control

## Technical Details

### State Management
The profile page uses local React state for UI management:
- `selectedUserId`: Currently selected user ID
- `viewMode`: Current view mode (list, view, create, edit)

### Data Flow
1. **User List**: Fetches all users via GraphQL
2. **User Selection**: Updates state and fetches individual user
3. **Profile Display**: Shows detailed user information
4. **Form Operations**: Creates new users via mutations
5. **Real-time Updates**: Automatically refetches data after mutations

### Error Handling
- **Network Errors**: Displays connection issues
- **GraphQL Errors**: Shows specific backend errors
- **Validation Errors**: Client-side form validation
- **Loading States**: Visual feedback during operations

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Grid**: Adapts to screen size
- **Color Scheme**: Consistent blue/purple theme
- **Animations**: Subtle transitions and loading states

## File Structure

```
frontend/
├── app/profille/
│   └── page.tsx                 # Main profile page
├── components/profile/
│   ├── ProfileDisplay.tsx       # User profile display
│   ├── ProfileForm.tsx          # User creation/edit form
│   └── UserList.tsx            # User list component
└── hooks/
    ├── useUser.ts              # User GraphQL operations
    └── types.ts                # Shared TypeScript types
```

## API Endpoints

### GraphQL Queries
- `users`: Fetch all users
- `user(id: String!)`: Fetch specific user by ID

### GraphQL Mutations
- `createUser(input: CreateUserInput!)`: Create new user

### Input Types
```typescript
interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}
```

### Response Types
```typescript
interface User {
  id: string;
  email: string;
  name: string;
}
```

## Usage Instructions

### Viewing Users
1. Navigate to the Profile page
2. Click "View All Users" to see the user list
3. Click on any user to view their detailed profile

### Creating Users
1. Click "Create New User" button
2. Fill in the required information:
   - Name (required)
   - Email (required, valid email format)
   - Password (required, minimum 6 characters)
3. Click "Create" to submit

### Navigation
- Use "Back to List" to return to the user list
- Switch between "View All Users" and "Create New User" modes
- All navigation preserves the current state

## Integration Notes

### Backend Requirements
- GraphQL endpoint accessible at `/api/graphql`
- User resolver with queries: `users`, `user`
- User resolver with mutations: `createUser`
- Proper CORS configuration for frontend access

### Environment Variables
- Backend API endpoint configured via `API_URL` environment variable
- Falls back to `http://localhost:4000/graphql` in development

### Authentication
- Currently implements basic authentication header setup
- Token stored in localStorage (can be enhanced)
- Ready for integration with authentication systems

## Testing

The implementation includes comprehensive error handling and loading states that make it easy to test:
- Network connectivity issues
- Backend service unavailability
- Invalid user data
- GraphQL errors

## Performance Considerations

- **Query Optimization**: Efficient GraphQL queries that fetch only needed data
- **Loading States**: Immediate feedback to users
- **Error Boundaries**: Graceful degradation on errors
- **Responsive Design**: Optimized for all devices

This profile page implementation provides a solid foundation for user management that can be extended with additional features as needed.