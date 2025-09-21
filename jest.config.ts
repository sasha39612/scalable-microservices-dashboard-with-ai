// jest.config.ts
export default {
  verbose: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverageFrom: [
    'backend/src/**/*.{ts,tsx,js}',
    'backend/common/src/**/*.{ts,tsx,js}',
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
