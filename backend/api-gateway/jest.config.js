module.exports = {
  verbose: true,
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        diagnostics: {
          ignoreCodes: [151002]
        }
      }
    ]
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  moduleNameMapper: {
    "^common$": "<rootDir>/../common/src",
    "^common/(.*)$": "<rootDir>/../common/src/$1"
  },
  collectCoverageFrom: [
    "**/src/**/*.{ts,tsx,js}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/build/**",
  ],
};
