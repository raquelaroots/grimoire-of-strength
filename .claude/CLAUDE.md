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
- **Kubernetes / Helm** (`k8s/`, `helm/ritual-ledger/`): `k8s/` is raw, literal manifests (a CKA-style
  showcase, no templating); `helm/ritual-ledger/` packages the identical resource set as a Helm chart.
  Both were validated against a real local `kind` cluster while building them (not just statically
  reviewed) — `kubectl apply --dry-run=client` needs live API-server discovery even in "client" mode
  (confirmed empirically), so there's no way to validate manifest schemas fully offline; a throwaway
  `kind` cluster is the actual verification path, not `--dry-run=client` alone. The app Deployment is
  fixed at `replicas: 1` (WAL-mode `better-sqlite3` is single-writer) — the Helm chart enforces this with
  a `fail` guard in `templates/deployment.yaml`, not just a comment. `readOnlyRootFilesystem` is
  deliberately **not** set on either the app Deployment or the CronJob pod: `POST /api/plan/regenerate`
  (exercised by `tests/api.spec.js`) writes `public/grimoire-of-strength.html` at runtime — don't
  "helpfully" harden this without checking that route first. The plan `ConfigMap` is mounted as a whole
  directory (`RITUAL_PLAN_PATH=/app/config/custom-workout-plan.md`), never via `subPath` — Kubernetes
  does not live-update `subPath`-mounted ConfigMap volumes. The `CronJob`'s test-runner image is a
  **separate Dockerfile stage** (`AS test-runner`, based on `mcr.microsoft.com/playwright:v1.62.0-noble`,
  not `node:22-alpine`) because the production image excludes `tests/` and devDependencies by design, and
  because Chromium's shared-library dependencies are painful on musl libc — that stage does its own full
  `npm ci` rather than reusing `builder`'s `node_modules`, since a musl-compiled native binding
  (`better-sqlite3`) won't load on the glibc base. Both the app and test-runner images use a **fixed
  numeric UID/GID (1001)**, not Alpine's `-S` system-user auto-allocation (`node:22-alpine` already owns
  UID/GID 1000 via its built-in `node` user) — `securityContext.runAsNonRoot: true` fails admission
  against a name-only image `USER` with "cannot verify user is non-root," confirmed against a real
  cluster; `runAsUser`/`runAsGroup`/`fsGroup` in both `k8s/05-deployment.yaml`/`07-cronjob.yaml` and the
  Helm chart's `values.yaml` must stay in sync with the Dockerfile's `adduser -u 1001`. Both PVCs
  (`data`, `allure-report`) carry `helm.sh/resource-policy: keep` in the Helm chart — **Helm deletes
  templated PVCs on `helm uninstall` by default**, a real gotcha caught by actually running
  `helm uninstall` against a live release, not something to assume away. `src/cleanAllureReport.js`
  removes `allure-report/`'s *contents*, not the directory itself, specifically because that directory is
  a bind/PVC mount point in Docker and Kubernetes — `fs.rmSync` on a mount point itself fails with EBUSY
  ("Device or resource busy"), also only surfaced by actually running the CronJob against a real cluster.
  No container registry is wired up — images are built locally and loaded via `kind load docker-image` /
  `minikube image load`; this is a deliberate, current-scope decision, not an oversight.
- **SQLite schema changes**: `src/schema.sql` only covers fresh databases. Existing databases need a
  matching `ensureColumn(...)` migration in `src/db.js` (see the `sets`/`difficulty` columns on `lifts`
  for the pattern).
- **In-app test runner** (`src/testRunner.js`, "🧪 Test Runner" tab): lets the app run its own Playwright
  suite and watch it live via SSE, with Cancel support and auto-regeneration of the Allure report on
  completion. **Dev-only by construction, not by config** — `server.js` probes for `tests/`,
  `@playwright/test`, and `tree-kill` via `require.resolve(...)` wrapped in try/catch at startup, and only
  `require("./src/testRunner")` (registering its routes) if all three resolve. Since the production Docker
  image installs with `npm ci --omit=dev` and `.dockerignore` excludes `tests/`, that probe is false there
  automatically — no env var or build-time flag needed, and no risk of a missing devDependency crashing
  the whole server (the probe only ever *checks* resolution, never loads the module until confirmed safe).
  If you touch this file: keep `tree-kill` in `devDependencies` (never regular `dependencies`), never add
  a top-level `require("tree-kill")`/`require("@playwright/test")` anywhere outside that guarded path, and
  remember the suite-selector test-file argument passed to Playwright's CLI must stay forward-slashed
  (`"tests/" + file`, not `path.join`) — Playwright matches that argument as a regex/glob against its own
  POSIX-style internal paths, so a `path.join`-produced backslash path on Windows silently matches zero
  tests. Process cancellation uses `tree-kill` (not plain `child.kill()`) specifically because Playwright's
  own `webServer` config spawns a grandchild process (the port-3100 test instance of this app) that a bare
  signal to the immediate child won't reach — killing the whole tree is what prevents that from being
  orphaned and later falsely "reused" by `reuseExistingServer`.

## Supplementary skills/docs in this directory

`.claude/skills/`, `.claude/docs/`, and `.claude/agent/commands/` contain reference material for
Playwright and Docker work pulled in from an external template. Treat them as optional background
reading, not as settings actively wired into this Claude Code session — see `.claude/hooks/README.md`
for why the hook scripts in that bundle aren't currently active.
