// One-off tool: renders scripts/pwa-icon-source.html at each icon size the
// PWA manifest and <link rel="icon">/<link rel="apple-touch-icon"> tags need,
// via Playwright screenshotting a headless page — same technique as
// scripts/generate-readme-gifs.mjs, not a new image-manipulation dependency.
// Not part of the test suite, CI, or app runtime; re-run manually whenever
// the logo design changes (keep pwa-icon-source.html's SVG in sync with
// public/ritual-ledger.html's .brand .glyph — they're meant to be identical).

import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const SOURCE_PATH = path.join(__dirname, "pwa-icon-source.html");
const OUT_DIR = path.join(REPO_ROOT, "public", "icons");
const SIZES = [16, 32, 180, 192, 512];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const size of SIZES) {
      const page = await browser.newPage({ viewport: { width: size, height: size } });
      await page.goto("file://" + SOURCE_PATH.replace(/\\/g, "/"));
      const outPath = path.join(OUT_DIR, `icon-${size}.png`);
      await page.screenshot({ path: outPath });
      await page.close();
      console.log(`  wrote icon-${size}.png`);
    }
  } finally {
    await browser.close();
  }
  console.log(`Done. Icons written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
