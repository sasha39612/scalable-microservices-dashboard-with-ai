'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  SessionUser,
  USER_FIELDS,
  getAccessToken,
  getTokenExpiry,
  postGraphQL,
  refreshSession,
  setSession,
  subscribeToSession,
} from '@/utils/auth-session';

type User = SessionUser;

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

// Refresh this long before the access token expires
const REFRESH_MARGIN_MS = 60_000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Mirror the shared session, which the Apollo client can also refresh
    const unsubscribe = subscribeToSession((nextToken, nextUser) => {
      setToken(nextToken);
      if (!nextToken) {
        setUser(null);
      } else if (nextUser) {
        setUser(nextUser);
      }
    });

    // Restore the session from the httpOnly refresh cookie
    refreshSession().finally(() => setIsLoading(false));

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!token) return;
    const expiresAt = getTokenExpiry(token);
    if (!expiresAt) return;

    // Silently renew the access token shortly before it expires
    const delay = Math.max(0, expiresAt - Date.now() - REFRESH_MARGIN_MS);
    const timer = setTimeout(() => {
      refreshSession();
    }, delay);
    return () => clearTimeout(timer);
  }, [token]);

  const authenticate = async (
    mutation: 'login' | 'register',
    variables: Record<string, string>,
  ) => {
    const args = mutation === 'login'
      ? '$email: String!, $password: String!'
      : '$email: String!, $password: String!, $name: String!';
    const params = mutation === 'login'
      ? 'email: $email, password: $password'
      : 'email: $email, password: $password, name: $name';

    const { data, errors } = await postGraphQL<
      Record<string, { access_token: string; user: User }>
    >(
      `mutation Auth(${args}) { ${mutation}(${params}) { access_token user { ${USER_FIELDS} } } }`,
      variables,
      null,
    );

    if (errors?.length || !data?.[mutation]) {
      throw new Error(errors?.[0]?.message ?? 'Authentication failed');
    }

    const { access_token, user: userData } = data[mutation];
    setSession(access_token, userData);
  };

  const login = (email: string, password: string) =>
    authenticate('login', { email, password });

  const register = (email: string, password: string, name: string) =>
    authenticate('register', { email, password, name });

  const logout = async () => {
    try {
      // Revoke the refresh token server-side and clear its cookie
      let currentToken = getAccessToken();
      if (currentToken && (getTokenExpiry(currentToken) ?? 0) <= Date.now()) {
        currentToken = await refreshSession();
      }
      if (currentToken) {
        await postGraphQL('mutation Logout { logout }', undefined, currentToken);
      }
    } catch {
      // Still log out locally if the server can't be reached
    }
    setSession(null, null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
