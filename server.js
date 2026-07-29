"use strict";

const path = require("path");
const express = require("express");
const db = require("./src/db");
const { parsePlanFile } = require("./src/planParser");
const { regenerate: regeneratePlan, PLAN_PATH } = require("./src/generatePlan");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { index: "ritual-ledger.html" }));

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

app.listen(PORT, () => {
  console.log(`Ritual Ledger listening at http://localhost:${PORT}`);
  console.log(`Database: ${db.dbPath}`);
});
