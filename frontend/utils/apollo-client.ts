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
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql'
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
