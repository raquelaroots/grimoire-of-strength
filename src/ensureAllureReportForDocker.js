"use strict";

// Docker COPY has no "copy if exists" — and allure-report/ is a gitignored,
// generated artifact, so a fresh checkout won't have one. This writes a
// friendly placeholder if there's no real report yet, so `docker build`
// never hard-fails on a missing directory. Run `npm run test:e2e:report`
// first if you want the image to bake in a real report instead.

const fs = require("fs");
const path = require("path");

const REPORT_DIR = path.join(__dirname, "..", "allure-report");
const INDEX_PATH = path.join(REPORT_DIR, "index.html");

if (fs.existsSync(INDEX_PATH)) {
  console.log("Using existing allure-report/ for the Docker build.");
} else {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(
    INDEX_PATH,
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Ritual Ledger QA Report</title></head>
<body style="background:#0a0610;color:#f2e8ef;font-family:sans-serif;padding:40px;">
<h1>No QA report has been generated yet</h1>
<p>Run <code>npm run test:e2e:report</code> locally, then rebuild this image, to bake in a real Allure report.</p>
</body>
</html>
`,
    "utf8"
  );
  console.log("No allure-report/ found — wrote a placeholder so the Docker build can proceed.");
}
