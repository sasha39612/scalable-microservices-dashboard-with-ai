module.exports = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.spec.ts"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^common$": "<rootDir>/../common/dist",
    "^common/(.*)$": "<rootDir>/../common/dist/$1"
  },
  collectCoverageFrom: [
    "**/src/**/*.{ts,tsx,js}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/build/**",
  ],
};
