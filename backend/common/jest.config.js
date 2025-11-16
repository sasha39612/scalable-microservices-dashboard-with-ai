module.exports = {
  verbose: true,
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  collectCoverageFrom: [
    "**/src/**/*.{ts,tsx,js}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/build/**",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
