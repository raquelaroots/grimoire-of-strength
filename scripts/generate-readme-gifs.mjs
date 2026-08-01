// One-off tool: drives a scratch instance of the app with Playwright and
// captures short animated GIF demos for README.md. Not part of the test
// suite, CI, or app runtime — run manually via `npm run generate:readme-gifs`
// whenever the UI changes enough that the demos go stale.
//
// Written as ESM (.mjs) so it can `import` gifenc (an ESM-only package)
// without touching the rest of the app's "type": "commonjs" convention.
// gifenc and pngjs ship without an "exports" map entry Node's ESM loader can
// use for named-export detection, so both are imported as default and
// destructured — verified against the installed versions before writing this.

import { spawn } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import treeKill from "tree-kill";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import gifencDefault from "gifenc";
import { RitualLedgerPage } from "../tests/pages/RitualLedgerPage.js";

const { GIFEncoder, quantize, applyPalette } = gifencDefault;
const treeKillAsync = promisify(treeKill);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "readme-assets");
const ALLURE_REPORT_INDEX = path.join(REPO_ROOT, "allure-report", "index.html");

const PORT = 3200;
const BASE_URL = `http://localhost:${PORT}`;
const VIEWPORT = { width: 960, height: 600 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(300);
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function startServer() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: REPO_ROOT,
    env: { ...process.env, PORT: String(PORT), RITUAL_DB_PATH: "data/.gif-demo.sqlite" },
    stdio: "ignore",
    windowsHide: true,
  });
  return child;
}

async function stopServer(child) {
  if (!child.pid) return;
  await treeKillAsync(child.pid, "SIGTERM").catch(() => {});
}

async function captureDuring(page, actionFn, { interval = 200, maxFrames = 40 } = {}) {
  const frames = [];
  let capturing = true;
  const loop = (async () => {
    while (capturing && frames.length < maxFrames) {
      frames.push(await page.screenshot({ type: "png" }));
      if (!capturing) break;
      await sleep(interval);
    }
  })();
  await actionFn();
  capturing = false;
  await loop;
  return frames;
}

function encodeGif(frames, { fps = 5 } = {}) {
  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);
  for (const buf of frames) {
    const png = PNG.sync.read(buf);
    const palette = quantize(png.data, 256);
    const index = applyPalette(png.data, palette);
    gif.writeFrame(index, png.width, png.height, { palette, delay });
  }
  gif.finish();
  return Buffer.from(gif.bytes());
}

async function writeGif(name, frames) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, name);
  fs.writeFileSync(outPath, encodeGif(frames));
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`  wrote ${name} (${frames.length} frames, ${sizeKb} KB)`);
}

async function demoDashboard(page) {
  console.log("Capturing: dashboard / ritual log demo");
  const app = new RitualLedgerPage(page);
  await app.goto();
  const frames = await captureDuring(page, async () => {
    await app.switchTab("log");
    await app.openLogForm();
    await app.fillLogEntry({
      date: "2026-07-31",
      workout: "1A",
      duration: 28,
      notes: "cast the working — README demo entry",
    });
    await app.saveLogEntry();
    await app.switchTab("dashboard");
    await sleep(600);
  });
  await writeGif("demo-dashboard.gif", frames);
}

async function demoTestRunner(page) {
  console.log("Capturing: test runner demo");
  const app = new RitualLedgerPage(page);
  await app.goto();
  await app.switchTab("testrunner");
  // Deliberately the "smoke" suite, not the default "All tests": the "api"
  // suite's Allure History test shells out to `npm run allure:generate`
  // *synchronously* mid-run, and a Cancel racing against that can SIGTERM
  // the child mid-write, leaving allure-report/ in a corrupted, index.html-less
  // state — reproduced once while developing this script. "smoke" has no such
  // step, so a cancel here can only ever land cleanly.
  await app.suiteSelect.selectOption("smoke");
  const frames = await captureDuring(page, async () => {
    await app.runTestsBtn.click();
    await sleep(2000);
    await app.cancelTestsBtn.click({ timeout: 5000 }); // auto-waits for enabled
    await sleep(600);
  });
  await writeGif("demo-test-runner.gif", frames);
}

async function demoQaReport(page) {
  if (!fs.existsSync(ALLURE_REPORT_INDEX)) {
    throw new Error(
      "allure-report/index.html not found — run `npm run test:e2e:report` first so the QA Report " +
        "demo captures a real report instead of the app's own \"no report yet\" placeholder."
    );
  }
  console.log("Capturing: QA report demo");
  const app = new RitualLedgerPage(page);
  await app.goto();
  const frames = await captureDuring(page, async () => {
    await app.switchTab("qa");
    await sleep(2500);
  });
  await writeGif("demo-qa-report.gif", frames);
}

async function main() {
  console.log(`Starting scratch server on port ${PORT}...`);
  const server = startServer();
  let browser;
  try {
    await waitForServer(`${BASE_URL}/api/health`);
    browser = await chromium.launch();
    const context = await browser.newContext({ baseURL: BASE_URL, viewport: VIEWPORT });
    const page = await context.newPage();

    await demoDashboard(page);
    await demoTestRunner(page);
    await demoQaReport(page);

    await context.close();
    console.log(`Done. GIFs written to ${OUT_DIR}`);
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
    const dbPath = path.join(REPO_ROOT, "data", ".gif-demo.sqlite");
    for (const suffix of ["", "-journal", "-wal", "-shm"]) {
      fs.rmSync(dbPath + suffix, { force: true });
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
