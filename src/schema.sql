CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  workout TEXT NOT NULL,
  duration INTEGER,
  energy INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bodyweight (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  weight REAL NOT NULL,
  unit TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lifts (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  exercise TEXT NOT NULL,
  weight REAL NOT NULL,
  sets INTEGER,
  reps INTEGER,
  difficulty INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS measurements (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
