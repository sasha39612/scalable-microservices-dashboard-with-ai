/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  testEnvironment: "node",
  roots: ["<rootDir>/backend/tests", "<rootDir>/backend/common/tests"], // include all test folders
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  collectCoverageFrom: [
    "backend/src/**/*.{ts,tsx,js}",
    "backend/common/src/**/*.{ts,tsx,js}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/build/**",
  ],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json", // ensure decorators + metadata
    },
  },
  testMatch: ["**/*.spec.ts"], // run only *.spec.ts files
};
