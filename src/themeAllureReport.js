"use strict";

// allure generate has no built-in custom-CSS option, but its dark theme is
// driven entirely by CSS custom properties (--color-*), so we inject a small
// override stylesheet after each generation instead of fighting the tool.
// Must be re-run after every `allure generate`, since it writes a fresh
// output directory each time — see the "allure:generate" npm script.

const fs = require("fs");
const path = require("path");

const REPORT_DIR = path.join(__dirname, "..", "allure-report");
const THEME_SOURCE = path.join(__dirname, "allure-theme.css");
const THEME_FILENAME = "ritual-theme.css";

function findReportDirs(dir) {
  const found = [];
  if (fs.existsSync(path.join(dir, "index.html"))) found.push(dir);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) found.push(...findReportDirs(path.join(dir, entry.name)));
  }
  return found;
}

function applyTheme() {
  if (!fs.existsSync(REPORT_DIR)) {
    console.error(`No allure-report directory found at ${REPORT_DIR} — run "allure generate" first.`);
    process.exit(1);
  }

  const themeCss = fs.readFileSync(THEME_SOURCE, "utf8");
  const dirs = findReportDirs(REPORT_DIR);

  for (const dir of dirs) {
    fs.writeFileSync(path.join(dir, THEME_FILENAME), themeCss, "utf8");

    const indexPath = path.join(dir, "index.html");
    const html = fs.readFileSync(indexPath, "utf8");
    if (html.includes(THEME_FILENAME)) continue;
    const themed = html.replace("</head>", `    <link rel="stylesheet" href="${THEME_FILENAME}">\n</head>`);
    fs.writeFileSync(indexPath, themed, "utf8");
  }

  console.log(`Applied Ritual Ledger theme to ${dirs.length} report page(s).`);
}

applyTheme();
