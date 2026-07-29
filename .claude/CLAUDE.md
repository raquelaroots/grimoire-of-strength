# Ritual of Strength — Project Context

Ritual of Strength is a personal, witchy-themed workout journaling webapp: a Node/Express + SQLite
backend serving `public/ritual-ledger.html` (the tracker) and a generated `public/grimoire-of-strength.html`
(a printable rite derived from `custom-workout-plan.md`). The app itself is used for real by its owner.

**But the project's primary purpose is a senior QA engineer portfolio piece.** The app is the system
under test; the actual deliverable is the demonstrated test engineering around it — automated coverage
with Playwright, deliberate test design (isolation, POM, meaningful assertions, tagged/annotated tests),
and polished, informative reporting (Allure). Plan: publish the repo publicly on GitHub and host the app
somewhere. The "pair it with a demonstration of test automation" question is resolved for local/self-hosted
use: the app itself now serves its own generated Allure report (see below) — a "🔬 QA Report" tab lets a
visitor see the app and its test coverage in one place. A CI-published version of the same report (e.g.
GitHub Actions + Pages) is a natural next step but not yet built.

**Implication for how to work on this repo:** when touching `tests/`, default to portfolio-quality, not
just "good enough to pass." Prefer explicit structure and visible signal (describe blocks by feature,
Allure epic/feature/story/severity annotations, step() breakdowns for anything with more than one
logical phase) over terse tests, even where a terser version would still be correct. Treat test files
as something a hiring manager will actually open and read.

Note: an earlier version of this file (and `.claude/agent/system.md`) claimed this repository's "sole
purpose" was generic claude-CLI-workflow tooling. That was inaccurate template boilerplate — likely
pulled in from an unrelated example bundle — and has been corrected here.

## Conventions worth following in this repo

- **Playwright** (`tests/`): tests are grouped with `test.describe()` by feature area and tagged via
  `allure-js-commons` (`epic`, `feature`, `story`, `severity`, `owner`) — see `tests/api.spec.js` and
  `tests/smoke.spec.js` for the pattern. Drive the UI through the Page Object Model in `tests/pages/`
  rather than raw locators inline. Avoid `waitForTimeout`; rely on Playwright's auto-waiting and
  `expect(...)`. Break multi-phase tests into named `step(...)` blocks so the report tells a story, not
  just a pass/fail.
- **Reporting**: three reporters run together — `list` (console), `html` (Playwright's own, via
  `npx playwright show-report`), and `allure-playwright` (writes `allure-results/`, built into
  `allure-report/` via `npm run allure:generate`, viewed via `npm run allure:open`). `npm run
  test:e2e:report` does both in one step. Don't delete `playwright-report/`, `allure-results/`, or
  `allure-report/` as part of routine cleanup — regenerate them, don't just wipe them silently.
  Note: the generated Allure report embeds a Google Analytics snippet by default (Allure's own
  telemetry, not something added here) — no supported opt-out was found; worth knowing before
  publishing the report publicly.
- **Docker** (`Dockerfile`, `docker-compose.yml`): multi-stage build, Alpine base, non-root runtime
  user, build-only tooling confined to the builder stage. `better-sqlite3` requires a compiler
  toolchain at install time regardless of base image (its `binding.gyp` triggers `node-gyp` even when
  a matching prebuilt binary exists) — that's why the builder stage installs `python3 make g++`.
  The image bakes in a snapshot of `allure-report/` for self-contained hosting (build with `npm run
  docker:build`, which writes a placeholder via `src/ensureAllureReportForDocker.js` if no real report
  exists yet, so the build never hard-fails on that gitignored directory). `docker-compose.yml`
  additionally bind-mounts `allure-report/` so local runs pick up a freshly regenerated report without
  a rebuild.
- **Serving the QA report from the app**: `server.js` mounts `/allure-report` as static files (with a
  friendly 404 page if the directory doesn't exist yet), and `public/ritual-ledger.html` has a "🔬 QA
  Report" nav tab that iframes it — same pattern as the existing "📖 Grimoire" tab. The Allure "Awesome"
  report's dark theme is driven by CSS custom properties (`--color-*`), which `src/allure-theme.css` +
  `src/themeAllureReport.js` override post-generation to match the app's void/pink/violet palette —
  deliberately *not* touching pass/fail/broken/skipped status colors or chart palettes, since those
  carry standard QA semantic meaning that shouldn't be sacrificed for brand consistency. The report logo
  (`public/assets/allure-logo.svg`) is referenced via an absolute `/assets/...` path rather than copied
  into the report bundle, since `--logo` passes its value through verbatim — this only resolves because
  the app and the report are served from the same origin.
- **SQLite schema changes**: `src/schema.sql` only covers fresh databases. Existing databases need a
  matching `ensureColumn(...)` migration in `src/db.js` (see the `sets`/`difficulty` columns on `lifts`
  for the pattern).

## Supplementary skills/docs in this directory

`.claude/skills/`, `.claude/docs/`, and `.claude/agent/commands/` contain reference material for
Playwright and Docker work pulled in from an external template. Treat them as optional background
reading, not as settings actively wired into this Claude Code session — see `.claude/hooks/README.md`
for why the hook scripts in that bundle aren't currently active.
