module.exports = {
  verbose: true,
  testEnvironment: "node",
  testMatch: ["<rootDir>/__tests__/**/*.js"], // Only match JS tests for now
  moduleFileExtensions: ["js", "json"],
  collectCoverageFrom: [
    "**/src/**/*.{js}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/build/**",
  ],
};
