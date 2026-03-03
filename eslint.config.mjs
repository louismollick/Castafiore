import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import tsParser from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    },
  },
  {
    files: ["app/**/*.js", "index.js", "App.js"],
    languageOptions: { globals: globals.browser },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      "react/prop-types": "off",
      // "react/react-in-jsx-scope": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "semi": ["error", "never"]
    },
  }
  ,
  {
    files: ["app/**/*.ts", "app/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: globals.browser
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      "react/prop-types": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "semi": ["error", "never"]
    },
  }
];
