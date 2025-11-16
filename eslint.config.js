// eslint.config.js
import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginReact from "eslint-plugin-react";
import tseslint from "@typescript-eslint/eslint-plugin";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: {}, // must be an object
});

export default [
  ...compat.extends("eslint:recommended"),
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  ...compat.extends("plugin:react/recommended"),
  ...compat.extends("prettier"),

  {
    ignores: ["node_modules/", "**/dist/", "**/build/", ".husky/", ".git/", "**/*.js"],

    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
    },

    plugins: {
      react: eslintPluginReact,
      "@typescript-eslint": tseslint,
    },

    rules: {
      "no-console": "warn",
      "react/react-in-jsx-scope": "off",
    },

    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
