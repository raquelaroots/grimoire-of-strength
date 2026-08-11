"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const db = require("./src/db");
const { parsePlanFile } = require("./src/planParser");
const { regenerate: regeneratePlan, PLAN_PATH } = require("./src/generatePlan");
const { validateLift } = require("./src/liftValidation");
const { computeWorkoutSummary } = require("./src/workoutSummary");

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
    // lifts is the one table with NOT NULL columns beyond `date` (exercise,
    // weight) that a client can plausibly omit — validate it specifically
    // rather than letting a missing field fall through to an uncaught
    // better-sqlite3 constraint error (a raw 500). Shared with
    // POST /api/ha/lifts below so there's one source of truth.
    if (table === "lifts") {
      const errors = validateLift(req.body || {});
      if (errors.length) return res.status(400).json({ error: "validation failed", details: errors });
    }
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

// ---------------- Home Assistant integration ----------------
// A dedicated, authenticated surface for external systems, rather than
// overloading the generic /api/lifts route above with auth — that route
// is used unauthenticated by this app's own
// browser frontend, and a public repo can never safely embed a secret in
// client-side JS to make it "authenticated" too. Reads (workout summary,
// the grimoire) stay open, matching every other GET route in this app;
// only the write route requires a key.

function requireHaApiKey(req, res, next) {
  const expected = process.env.RITUAL_HA_API_KEY;
  if (!expected) {
    // Fail closed: an unset key means "integration not configured," never
    // "allow the request through unauthenticated."
    return res.status(503).json({ error: "Home Assistant integration is not configured" });
  }
  const match = (req.get("authorization") || "").match(/^Bearer (.+)$/);
  const provided = match ? match[1] : "";
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  const valid = expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);
  if (!valid) return res.status(401).json({ error: "unauthorized" });
  next();
}

app.post("/api/ha/lifts", requireHaApiKey, (req, res) => {
  const errors = validateLift(req.body || {});
  if (errors.length) return res.status(400).json({ error: "validation failed", details: errors });
  const record = db.insert("lifts", req.body || {});
  res.status(201).json(record);
});

app.get("/api/ha/workout-summary", (req, res) => {
  res.json(computeWorkoutSummary(db.list("completions")));
});

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
