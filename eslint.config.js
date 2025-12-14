// eslint.config.js
import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginReact from "eslint-plugin-react";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: {},
});

export default [
  // Global ignores - must be first
  {
    ignores: [
      "node_modules/",
      "**/node_modules/",
      "**/dist/",
      "**/build/",
      "**/.next/",
      "**/*.js",
      "**/*.mjs",
      ".husky/",
      ".git/",
      "**/*.d.ts", // Ignore declaration files to avoid parsing issues
    ],
  },

  // Backend services (no React)
  {
    files: ["backend/**/*.ts", "backend/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Frontend and Mobile (with React)
  {
    files: ["frontend/**/*.ts", "frontend/**/*.tsx", "mobile/**/*.ts", "mobile/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: eslintPluginReact,
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-console": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
    settings: {
      react: {
        version: "18.2",
      },
    },
  },

  // Root level TypeScript files
  {
    files: ["*.ts", "*.tsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
