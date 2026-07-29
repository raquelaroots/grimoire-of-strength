"use strict";

// allure awesome appears to reuse/cache prior run config (report name, logo)
// when the output directory already exists, so we force a clean slate before
// every generation. Written in Node rather than `rm -rf` for portability
// across the Windows/macOS/Linux shells this might run under via npm scripts.

const fs = require("fs");
const path = require("path");

const REPORT_DIR = path.join(__dirname, "..", "allure-report");

fs.rmSync(REPORT_DIR, { recursive: true, force: true });
