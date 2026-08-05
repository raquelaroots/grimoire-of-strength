"use strict";

// allure awesome appears to reuse/cache prior run config (report name, logo)
// when the output directory already exists, so we force a clean slate before
// every generation. Written in Node rather than `rm -rf` for portability
// across the Windows/macOS/Linux shells this might run under via npm scripts.
//
// Removes REPORT_DIR's *contents*, not the directory itself: when this repo runs in
// Docker/Kubernetes, allure-report/ is typically a bind mount or PVC mount point, and
// removing a mount point directory (as opposed to what's inside it) fails with EBUSY
// ("Device or resource busy") — confirmed by actually running this against a real
// Kubernetes CronJob while building the k8s/ manifests. Recreating the directory itself
// (fs.mkdirSync below) is a no-op when it's already a mount point, and cheap when it's
// a plain local directory (e.g. a first-ever `npm run allure:generate` with no
// allure-report/ yet).

const fs = require("fs");
const path = require("path");

const REPORT_DIR = path.join(__dirname, "..", "allure-report");

if (fs.existsSync(REPORT_DIR)) {
  for (const entry of fs.readdirSync(REPORT_DIR)) {
    fs.rmSync(path.join(REPORT_DIR, entry), { recursive: true, force: true });
  }
} else {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}
