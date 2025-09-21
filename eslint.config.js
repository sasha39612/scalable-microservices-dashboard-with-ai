// eslint.config.js
const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {}, // must be an object, not `true`
});

module.exports = [
  ...compat.extends("eslint:recommended"),
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  ...compat.extends("plugin:react/recommended"),
  ...compat.extends("prettier"),

  {
    ignores: ["node_modules/", "dist/", "build/", ".husky/", ".git/"],

    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
    },

    plugins: {
      react: require("eslint-plugin-react"),
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
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
