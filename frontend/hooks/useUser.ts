'use client';

import { gql } from '@apollo/client';
import { useQuery, useMutation } from "@apollo/client/react";
import { User, CreateUserInput } from './types';

// Re-export types for convenience
export type { User, CreateUserInput };

const GET_USER_QUERY = gql`
  query GetUser($id: String!) {
    user(id: $id) {
      id
      email
      name
    }
  }
`;

const GET_USERS_QUERY = gql`
  query GetUsers {
    users {
      id
      email
      name
    }
  }
`;

const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      name
    }
  }
`;

export function useUser(id?: string) {
  const { data, loading, error, refetch } = useQuery<{ user: User }>(
    GET_USER_QUERY,
    {
      variables: { id },
      skip: !id,
      errorPolicy: 'all'
    }
  );

  return {
    user: data?.user || null,
    loading,
    error: error?.message || null,
    refetch
  };
}

export function useUsers() {
  const { data, loading, error, refetch } = useQuery<{ users: User[] }>(
    GET_USERS_QUERY,
    {
      errorPolicy: 'all'
    }
  );

  return {
    users: data?.users || [],
    loading,
    error: error?.message || null,
    refetch
  };
}

export function useCreateUser() {
  const [createUserMutation, { loading, error }] = useMutation<
    { createUser: User },
    { input: CreateUserInput }
  >(CREATE_USER_MUTATION);

  const createUser = async (input: CreateUserInput) => {
    try {
      const result = await createUserMutation({
        variables: { input },
      });
      return result.data?.createUser || null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating user:', err);
      throw err;
    }
  };

  return {
    createUser,
    loading,
    error: error?.message || null
  };
}