// Setup file for Jest tests
// Set required environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-jwt-signing-in-tests';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-jwt-signing-in-tests';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';
