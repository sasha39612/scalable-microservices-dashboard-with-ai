// utils/auth-session.ts
// In-memory auth session shared by AuthContext and the Apollo client.
// The access token never touches localStorage; the refresh token lives in an
// httpOnly cookie set by the API gateway and is sent automatically on /api/graphql.

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

type SessionListener = (token: string | null, user: SessionUser | null) => void;

const GRAPHQL_ENDPOINT = '/api/graphql';

export const USER_FIELDS = 'id email name role';

let accessToken: string | null = null;
const listeners = new Set<SessionListener>();
let refreshInFlight: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSession(token: string | null, user: SessionUser | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener(token, user));
}

export function subscribeToSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * POST a GraphQL operation to the Next.js proxy, sending the refresh cookie
 * and, when available, the access token.
 */
export async function postGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  token: string | null = accessToken,
): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

async function requestNewAccessToken(): Promise<string | null> {
  try {
    const { data } = await postGraphQL<{
      refreshToken: { access_token: string; user: SessionUser };
    }>(
      `mutation RefreshToken { refreshToken { access_token user { ${USER_FIELDS} } } }`,
      undefined,
      null,
    );

    if (!data?.refreshToken) {
      setSession(null, null);
      return null;
    }

    setSession(data.refreshToken.access_token, data.refreshToken.user);
    return data.refreshToken.access_token;
  } catch {
    setSession(null, null);
    return null;
  }
}

/**
 * Exchange the refresh cookie for a new access token. Concurrent callers share
 * one request: the server rotates the refresh token, so a second parallel
 * request with the old cookie would be rejected.
 */
export function refreshSession(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = requestNewAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Read the `exp` claim (ms since epoch) without verifying the token */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}
