"use strict";

const js = require("@eslint/js");
const globals = require("globals");
const playwright = require("eslint-plugin-playwright");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "allure-report/**",
      "allure-results/**",
      "playwright-report/**",
      "test-results/**",
      "data/**",
      "public/grimoire-of-strength.html", // generated output, not authored source
    ],
  },
  js.configs.recommended,
  {
    // Node-context CommonJS: server, backend helpers, Playwright config.
    files: ["server.js", "src/**/*.js", "playwright.config.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
  },
  {
    // Playwright test files — same Node/CJS context, plus Playwright-specific lint rules.
    files: ["tests/**/*.js"],
    plugins: playwright.configs["flat/recommended"].plugins,
    rules: playwright.configs["flat/recommended"].rules,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...playwright.configs["flat/recommended"].languageOptions.globals,
      },
    },
  },
];
