import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
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
  testMatch: [
    '<rootDir>/backend/**/__tests__/**/*.spec.ts',
    '<rootDir>/backend/**/tests/**/*.spec.ts',
    '<rootDir>/backend/**/*.spec.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};

export default config;
