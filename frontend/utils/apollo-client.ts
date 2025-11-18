// utils/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';

// Optional: middleware link (e.g., for auth headers)
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('authToken'); // or wherever you store your token
  if (token) {
    operation.setContext({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return forward(operation);
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
    // eslint-disable-next-line no-console
    console.log('GraphQL Request:', uri, options?.body);
    return fetch(uri, options);
  }
});

// Create Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink), // combine auth and http links
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
