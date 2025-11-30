module.exports = {
  verbose: true,
  testEnvironment: "node",
  testMatch: ["<rootDir>/__tests__/**/*.js"], // Only match JS tests for now
  moduleFileExtensions: ["js", "json"],
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
