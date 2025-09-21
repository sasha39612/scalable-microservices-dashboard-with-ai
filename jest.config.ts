// jest.config.ts
export default {
  verbose: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverageFrom: [
    'backend/api-gateway/src/**/*.{ts,tsx,js}',
    'backend/worker-service/src/**/*.{ts,tsx,js}',
    'backend/common/**/*.{ts,tsx,js}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  testMatch: ['**/backend/**/tests/**/*.spec.ts'],
};
