// utils/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, CombinedGraphQLErrors } from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { from, switchMap, throwError } from 'rxjs';
import { getAccessToken, refreshSession } from './auth-session';

// Auth middleware link - adds the in-memory JWT access token to requests
const authLink = new ApolloLink((operation, forward) => {
  const token = getAccessToken();
  if (token) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    }));
  }
  return forward(operation);
});

// The gateway reports 401s as UNAUTHENTICATED: under `extensions` in development,
// at the top level in production (see formatError in the api-gateway app.module)
const isUnauthenticated = (error: unknown) =>
  CombinedGraphQLErrors.is(error) &&
  error.errors.some(
    (e) =>
      e.extensions?.code === 'UNAUTHENTICATED' ||
      (e as { code?: string }).code === 'UNAUTHENTICATED',
  );

// Expired access token: refresh it once via the httpOnly cookie, then retry the operation
const refreshLink = new ErrorLink(({ error, operation, forward }) => {
  if (!isUnauthenticated(error) || operation.getContext().authRetried) {
    return;
  }

  return from(refreshSession()).pipe(
    switchMap((token) => {
      if (!token) {
        return throwError(() => error);
      }
      operation.setContext({ authRetried: true });
      return forward(operation);
    }),
  );
});

// HTTP link to your GraphQL endpoint
// Use environment variable in production, fallback to localhost in development
const getGraphQLUri = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Browser environment - use proxy endpoint to avoid CORS and SSH tunnel issues
    const uri = '/api/graphql'; // Use the Next.js API route proxy
    // eslint-disable-next-line no-console
    console.log('Apollo Client URI (browser):', uri);
    return uri;
  }
  // Server environment - use direct connection for SSR
  const uri = process.env.API_URL || 'http://localhost:4000/graphql';
  // eslint-disable-next-line no-console
  console.log('Apollo Client URI (server):', uri);
  return uri;
};

const httpLink = new HttpLink({
  uri: getGraphQLUri(),
  fetch: (uri, options) => {
    // Debug: Log the outgoing request
    try {
      if (options?.body) {
        const parsedBody = JSON.parse(options.body as string);
        // eslint-disable-next-line no-console
        console.log('🚀 GraphQL Request:', JSON.stringify(parsedBody, null, 2));
        
        // Validate chat mutations
        if (parsedBody.variables && parsedBody.variables.input && 
            parsedBody.query && parsedBody.query.includes('SendChatMessage')) {
          const input = parsedBody.variables.input;
          
          if (!input.messages || !Array.isArray(input.messages)) {
            // eslint-disable-next-line no-console
            console.error('🚫 Invalid chat request detected:', input);
            throw new Error('Chat request must include a "messages" array');
          }
          
          // eslint-disable-next-line no-console
          console.log('✅ Chat request validation passed');
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Request validation error:', error);
    }
    
    return fetch(uri, options);
  }
});

// Create Apollo Client
const client = new ApolloClient({
  link: ApolloLink.from([refreshLink, authLink, httpLink]), // retry-on-401, auth, http
  cache: new InMemoryCache(),      // caching
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network', // adjust as needed
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});

export default client;
