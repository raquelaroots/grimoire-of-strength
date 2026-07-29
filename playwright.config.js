"use strict";

const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    [
      "allure-playwright",
      {
        resultsDir: "allure-results",
        detail: true,
        suiteTitle: false,
        environmentInfo: {
          app: "Ritual Ledger",
          framework: "Playwright",
          node_version: process.version,
        },
        categories: [
          { name: "Product defects", matchedStatuses: ["failed"] },
          { name: "Test defects", matchedStatuses: ["broken"] },
          { name: "Flaky tests", flaky: true },
        ],
      },
    ],
  ],
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "node server.js",
    env: {
      PORT: "3100",
      RITUAL_DB_PATH: "data/.playwright-test.sqlite",
    },
    url: "http://localhost:3100/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
