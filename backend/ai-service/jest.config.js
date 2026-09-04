module.exports = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.spec.ts"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "**/src/**/*.{ts,js}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/build/**",
  ],
};
