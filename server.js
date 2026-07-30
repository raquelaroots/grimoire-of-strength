"use strict";

const fs = require("fs");
const path = require("path");
const express = require("express");
const db = require("./src/db");
const { parsePlanFile } = require("./src/planParser");
const { regenerate: regeneratePlan, PLAN_PATH } = require("./src/generatePlan");

const app = express();
const PORT = process.env.PORT || 3000;
const ALLURE_REPORT_DIR = path.join(__dirname, "allure-report");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { index: "ritual-ledger.html" }));

app.use(
  "/allure-report",
  (req, res, next) => {
    if (!fs.existsSync(path.join(ALLURE_REPORT_DIR, "index.html"))) {
      res
        .status(404)
        .type("html")
        .send("<h1>No Allure report yet</h1><p>Run <code>npm run test:e2e:report</code> to generate one.</p>");
      return;
    }
    next();
  },
  express.static(ALLURE_REPORT_DIR)
);

const MUTABLE_TABLES = ["completions", "bodyweight", "lifts", "measurements"];
const EDITABLE_TABLES = ["completions", "lifts"];

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/data", (req, res) => {
  res.json(db.getAllData());
});

app.get("/api/export", (req, res) => {
  res.json(db.getAllData());
});

app.post("/api/import", (req, res) => {
  const body = req.body || {};
  db.replaceAll(body);
  res.json(db.getAllData());
});

app.post("/api/clear", (req, res) => {
  db.clearAll();
  res.json(db.getAllData());
});

app.get("/api/plan", (req, res) => {
  try {
    res.json(parsePlanFile(PLAN_PATH));
  } catch (err) {
    res.status(500).json({ error: "could not parse plan", detail: err.message });
  }
});

app.post("/api/plan/regenerate", (req, res) => {
  try {
    const plan = regeneratePlan();
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: "could not regenerate grimoire", detail: err.message });
  }
});

for (const table of MUTABLE_TABLES) {
  app.post(`/api/${table}`, (req, res) => {
    const record = db.insert(table, req.body || {});
    res.status(201).json(record);
  });

  app.delete(`/api/${table}/:id`, (req, res) => {
    const removed = db.remove(table, req.params.id);
    if (!removed) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  });
}

for (const table of EDITABLE_TABLES) {
  app.put(`/api/${table}/:id`, (req, res) => {
    const record = db.update(table, req.params.id, req.body || {});
    if (!record) return res.status(404).json({ error: "not found" });
    res.json(record);
  });
}

// Dev-only feature: lets the app run its own Playwright suite and watch it
// live. Never unconditionally require()'d — the production Docker image
// installs with `npm ci --omit=dev` and excludes tests/ from the build
// context, so both probes below are false there, and this whole block (plus
// testRunner.js's own top-level `require("tree-kill")`) is skipped entirely.
// require.resolve() only checks that a module *would* resolve — it doesn't
// execute it — so probing this way can never crash a build that lacks these
// devDependencies.
const TEST_RUNNER_AVAILABLE = (() => {
  try {
    return (
      fs.existsSync(path.join(__dirname, "tests")) &&
      !!require.resolve("@playwright/test/package.json", { paths: [__dirname] }) &&
      !!require.resolve("tree-kill", { paths: [__dirname] })
    );
  } catch {
    return false;
  }
})();

app.get("/api/test-runner/available", (req, res) => {
  res.json({ available: TEST_RUNNER_AVAILABLE });
});

let testRunner = null;
if (TEST_RUNNER_AVAILABLE) {
  testRunner = require("./src/testRunner");
  testRunner.registerRoutes(app);
}

function shutdown() {
  if (testRunner) testRunner.killActiveRun();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

app.listen(PORT, () => {
  console.log(`Ritual Ledger listening at http://localhost:${PORT}`);
  console.log(`Database: ${db.dbPath}`);
});
