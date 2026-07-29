"use strict";

// Parses custom-workout-plan.md's markdown into a structured plan object.
// Relies on the doc's existing heading conventions staying intact:
//   ## Workout N · Week X [(Alternate)] — Title — durationLabel
//   ### Warm-up (duration)
//   ### <Circuit Title> (duration) [— roundsNote]
//   ### Mobility Flow (duration)          (workout 2 only)
//   ### Cool-down Stretches (duration)
//   ## Optional Session N — Title (duration)
//   ## Progression Notes
// Exercise names/reps/notes/durations/rules can be edited freely; the
// heading hierarchy itself needs a matching parser update if it changes.

const fs = require("fs");

const META_LINE = /^\*\*(.+?):\*\*\s*(.*)$/;
const WORKOUT_HEADER = /^## Workout (\d+) · Week ([AB])(?:\s*\(Alternate\))? — (.+?) — (.+)$/;
const OPTIONAL_HEADER = /^## Optional Session \d+ — (.+?) \(([^)]+)\)\s*$/;
const PROGRESSION_HEADER = /^## Progression Notes\s*$/;
const SUBHEADER = /^### (.+?) \(([^)]+)\)(?:\s+—\s+(.*))?$/;
const BULLET = /^-\s+(.*)$/;
const BOLD_LEAD = /^\*\*(.+?)\*\*\s*(.*)$/;

const META_KEYS = {
  frequency: "frequency",
  variety: "variety",
  "designed to complement": "complement",
  goals: "goals",
  "hernia-safe": "herniaSafe",
};

function parseBullet(line) {
  const m = line.match(BOLD_LEAD);
  if (m) return { lead: m[1], text: m[2].replace(/^—\s*/, "") };
  return { lead: null, text: line };
}

function collectBullets(lines, i) {
  const items = [];
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === "") { i++; continue; }
    const m = line.match(BULLET);
    if (!m) break;
    items.push(parseBullet(m[1]));
    i++;
  }
  return { items, next: i };
}

function collectTable(lines, i) {
  const rows = [];
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === "") { i++; continue; }
    if (!line.startsWith("|")) break;
    if (/^\|[\s:-]+\|/.test(line)) { i++; continue; } // separator row
    const cells = line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (cells[0].toLowerCase() !== "exercise") {
      rows.push({ exercise: cells[0], reps: cells[1] || "", notes: cells[2] || "" });
    }
    i++;
  }
  return { rows, next: i };
}

function parseWorkoutBlock(lines) {
  const headerMatch = lines[0].match(WORKOUT_HEADER);
  const workout = {
    code: headerMatch[1] + headerMatch[2],
    number: parseInt(headerMatch[1], 10),
    week: headerMatch[2],
    title: headerMatch[3].trim(),
    durationLabel: headerMatch[4].trim(),
    note: null,
    warmup: null,
    circuit: null,
    mobilityFlow: null,
    cooldown: null,
  };

  let i = 1;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i < lines.length && !lines[i].startsWith("###")) {
    workout.note = lines[i].trim();
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === "") { i++; continue; }
    const sub = line.match(SUBHEADER);
    if (!sub) { i++; continue; }
    const title = sub[1].trim();
    const duration = sub[2].trim();
    const roundsNote = sub[3] ? sub[3].trim() : null;
    i++;

    if (title === "Warm-up") {
      const { items, next } = collectBullets(lines, i);
      workout.warmup = { duration, items };
      i = next;
    } else if (title === "Mobility Flow") {
      const { items, next } = collectBullets(lines, i);
      workout.mobilityFlow = { duration, items };
      i = next;
    } else if (title.indexOf("Cool-down") === 0) {
      const { items, next } = collectBullets(lines, i);
      workout.cooldown = { duration, items };
      i = next;
    } else if (title.indexOf("Circuit") !== -1) {
      const { rows, next } = collectTable(lines, i);
      workout.circuit = { title, duration, roundsNote, exercises: rows };
      i = next;
    } else {
      // unrecognized subsection — skip its content until the next ### or end
      while (i < lines.length && !lines[i].trim().startsWith("###")) i++;
    }
  }

  return workout;
}

function parsePlan(markdown) {
  const lines = markdown.split(/\r?\n/);

  const plan = {
    meta: { title: "", frequency: "", variety: "", complement: "", goals: "", herniaSafe: "", generalRules: [] },
    workouts: [],
    optionalSession: null,
    progression: [],
  };

  let i = 0;
  const titleMatch = lines[0] && lines[0].match(/^# (.+)$/);
  if (titleMatch) { plan.meta.title = titleMatch[1].trim(); i = 1; }

  // meta block: **Key:** value lines, up to and including **General rules:** bullets
  while (i < lines.length && !lines[i].trim().startsWith("## ")) {
    const line = lines[i].trim();
    const m = line.match(META_LINE);
    if (m) {
      const key = m[1].trim().toLowerCase();
      if (key === "general rules") {
        i++;
        const { items, next } = collectBullets(lines, i);
        plan.meta.generalRules = items.map((it) => it.text);
        i = next;
        continue;
      }
      const field = META_KEYS[key];
      if (field) plan.meta[field] = m[2].trim();
    }
    i++;
  }

  if (i >= lines.length) return plan;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.startsWith("## ")) { i++; continue; }

    let end = i + 1;
    while (end < lines.length && !lines[end].trim().startsWith("## ")) end++;
    const block = lines.slice(i, end);

    if (WORKOUT_HEADER.test(block[0].trim())) {
      const rebuilt = [block[0].trim()].concat(block.slice(1));
      plan.workouts.push(parseWorkoutBlock(rebuilt));
    } else if (OPTIONAL_HEADER.test(block[0].trim())) {
      const m = block[0].trim().match(OPTIONAL_HEADER);
      let j = 1;
      while (j < block.length && block[j].trim() === "") j++;
      let description = null;
      if (j < block.length && !block[j].trim().startsWith("-")) {
        description = block[j].trim();
        j++;
      }
      const { items } = collectBullets(block, j);
      plan.optionalSession = { title: m[1].trim(), duration: m[2].trim(), description, items };
    } else if (PROGRESSION_HEADER.test(block[0].trim())) {
      const { items } = collectBullets(block, 1);
      plan.progression = items.map((it) => it.text);
    }

    i = end;
  }

  plan.workouts.sort((a, b) => a.code.localeCompare(b.code));
  return plan;
}

function parsePlanFile(filePath) {
  return parsePlan(fs.readFileSync(filePath, "utf8"));
}

module.exports = { parsePlan, parsePlanFile };
