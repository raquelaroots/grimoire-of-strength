"use strict";

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const dbPath = process.env.RITUAL_DB_PATH || path.join(__dirname, "..", "data", "ritual-ledger.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

// schema.sql only covers fresh databases (CREATE TABLE IF NOT EXISTS); existing
// databases from earlier versions need new columns added on top.
function ensureColumn(table, column, ddl) {
  const existing = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!existing.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}
ensureColumn("lifts", "sets", "sets INTEGER");
ensureColumn("lifts", "difficulty", "difficulty INTEGER");

// column order per table, excluding the DB-only created_at bookkeeping column
const TABLES = {
  completions: ["id", "date", "workout", "duration", "energy", "notes"],
  bodyweight: ["id", "date", "weight", "unit"],
  lifts: ["id", "date", "exercise", "weight", "sets", "reps", "difficulty"],
  measurements: ["id", "date", "metric", "value", "unit"],
};

const statements = {};
for (const table of Object.keys(TABLES)) {
  const cols = TABLES[table];
  const nonId = cols.filter((c) => c !== "id");
  statements[table] = {
    list: db.prepare(`SELECT ${cols.join(", ")} FROM ${table} ORDER BY date ASC, created_at ASC`),
    insert: db.prepare(
      `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((c) => "@" + c).join(", ")})`
    ),
    update: db.prepare(
      `UPDATE ${table} SET ${nonId.map((c) => c + " = @" + c).join(", ")} WHERE id = @id`
    ),
    delete: db.prepare(`DELETE FROM ${table} WHERE id = ?`),
    clear: db.prepare(`DELETE FROM ${table}`),
  };
}

function list(table) {
  return statements[table].list.all();
}

function insert(table, row) {
  const cols = TABLES[table];
  const record = { id: row.id || crypto.randomUUID() };
  for (const col of cols) {
    if (col === "id") continue;
    record[col] = row[col] === undefined ? null : row[col];
  }
  statements[table].insert.run(record);
  return record;
}

function update(table, id, row) {
  const cols = TABLES[table];
  const record = { id };
  for (const col of cols) {
    if (col === "id") continue;
    record[col] = row[col] === undefined ? null : row[col];
  }
  const result = statements[table].update.run(record);
  return result.changes > 0 ? record : null;
}

function remove(table, id) {
  const result = statements[table].delete.run(id);
  return result.changes > 0;
}

function getAllData() {
  const data = {};
  for (const table of Object.keys(TABLES)) data[table] = list(table);
  return data;
}

const replaceAll = db.transaction((data) => {
  for (const table of Object.keys(TABLES)) {
    statements[table].clear.run();
    const rows = Array.isArray(data[table]) ? data[table] : [];
    for (const row of rows) insert(table, row);
  }
});

const clearAll = db.transaction(() => {
  for (const table of Object.keys(TABLES)) statements[table].clear.run();
});

module.exports = { TABLES, list, insert, update, remove, getAllData, replaceAll, clearAll, dbPath };
