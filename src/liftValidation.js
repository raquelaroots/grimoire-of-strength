"use strict";

// Validates the payload for a lift entry before it reaches src/db.js's insert().
// `lifts` has three NOT NULL columns in schema.sql (date, exercise, weight) —
// without this, a missing field surfaces as an uncaught better-sqlite3
// constraint error (a raw 500 with a stack trace) instead of a clean 400.
// Shared by both POST /api/lifts (the app's own frontend) and POST
// /api/ha/lifts (the Home Assistant integration) so there's one source of
// truth for what a valid lift looks like, not two copies that can drift.

function validateLift(body) {
  const errors = [];
  if (!body || typeof body.date !== "string" || !body.date.trim()) {
    errors.push("date is required");
  }
  if (!body || typeof body.exercise !== "string" || !body.exercise.trim()) {
    errors.push("exercise is required");
  }
  if (!body || typeof body.weight !== "number" || !Number.isFinite(body.weight)) {
    errors.push("weight is required and must be a number");
  }
  return errors;
}

module.exports = { validateLift };
