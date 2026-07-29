"use strict";

const fs = require("fs");
const path = require("path");
const { parsePlanFile } = require("./planParser");
const { generateGrimoireHTML } = require("./grimoireGenerator");

const PLAN_PATH = process.env.RITUAL_PLAN_PATH || path.join(__dirname, "..", "custom-workout-plan.md");
const GRIMOIRE_PATH = path.join(__dirname, "..", "public", "grimoire-of-strength.html");

function regenerate() {
  const plan = parsePlanFile(PLAN_PATH);
  const html = generateGrimoireHTML(plan);
  fs.writeFileSync(GRIMOIRE_PATH, html, "utf8");
  return plan;
}

if (require.main === module) {
  regenerate();
  console.log(`Regenerated ${GRIMOIRE_PATH}`);
}

module.exports = { regenerate, PLAN_PATH, GRIMOIRE_PATH };
