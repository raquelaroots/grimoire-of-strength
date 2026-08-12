"use strict";

// Faithful backend port of public/ritual-ledger.html's "Cast Today's Working"
// suggestion algorithm (isoWeekNumber / currentCycle / the type-flip logic /
// computeStreak) — used by GET /api/ha/workout-summary so Home Assistant sees
// the exact same suggestion the dashboard itself shows, not a reinvented
// approximation that could quietly drift from the real UI over time.
// Pure function, no Express/DB coupling — takes the raw completions list and
// an optional reference date (for testability), returns a plain object.

function isoWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

function computeWorkoutSummary(completions, now = new Date()) {
  const wk = isoWeekNumber(now);
  const cycle = wk % 2 === 0 ? "B" : "A";
  const moonPhase = cycle === "A" ? "Waxing Moon" : "Waning Moon";

  const sorted = completions.slice().sort((a, b) => b.date.localeCompare(a.date));
  let lastType = "1";
  if (sorted.length) {
    const lastCode = sorted[0].workout;
    if (lastCode.indexOf("1") === 0) lastType = "2";
    else if (lastCode.indexOf("2") === 0) lastType = "1";
  }
  const suggestedCode = lastType + cycle;
  const suggestedLabel =
    (lastType === "1" ? "Workout 1" : "Workout 2") + cycle + (lastType === "1" ? " (Strength)" : " (Core & Mobility)");

  // streak: consecutive ISO weeks (walking back from `now`) with >=1 completion
  const weeksWithSession = new Set();
  for (const c of completions) {
    const d = new Date(c.date + "T00:00:00");
    weeksWithSession.add(d.getFullYear() + "-" + isoWeekNumber(d));
  }
  let streak = 0;
  const cursor = new Date(now);
  while (weeksWithSession.has(cursor.getFullYear() + "-" + isoWeekNumber(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }

  return {
    cycle,
    moonPhase,
    suggestedCode,
    suggestedLabel,
    streak,
    totalRituals: completions.length,
    lastWorking: sorted[0] ? { date: sorted[0].date, workout: sorted[0].workout } : null,
  };
}

module.exports = { computeWorkoutSummary, isoWeekNumber };
