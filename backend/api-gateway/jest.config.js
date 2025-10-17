module.exports = {
  verbose: true,
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      diagnostics: {
        ignoreCodes: [151002]
      }
    }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  collectCoverageFrom: [
    "**/src/**/*.{ts,tsx,js}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/build/**",
  ],
};
