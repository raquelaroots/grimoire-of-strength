# 🕯️ Ritual of Strength

[![CI](https://github.com/raquelaroots/grimoire-of-strength/actions/workflows/ci.yml/badge.svg)](https://github.com/raquelaroots/grimoire-of-strength/actions/workflows/ci.yml)
[![Tested with Playwright](https://img.shields.io/badge/tested%20with-Playwright-2EAD33?logo=playwright&logoColor=white)](tests/)
[![Kubernetes ready](https://img.shields.io/badge/k8s-ready-326CE5?logo=kubernetes&logoColor=white)](k8s/)
[![Helm chart](https://img.shields.io/badge/Helm-chart-0F1689?logo=helm&logoColor=white)](helm/ritual-ledger/)
[![Docker](https://img.shields.io/badge/container-Docker-2496ED?logo=docker&logoColor=white)](Dockerfile)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**progress · completions · devotion**

*A witchy workout ledger — and, more to the point, a demonstration of senior QA test
engineering practice.*

**[🔮 Read my professional portfolio →](https://raquelaroots.github.io/grimoire-of-strength/)**

---

## ✦ What this actually is

The app underneath is real — a personal Node/Express + SQLite workout tracker its owner
actually uses. But **the app is the system under test; the test engineering around it is the
deliverable.** This repo exists to show how I approach quality on a real, working codebase:
Playwright suites with deliberate structure, a themed and self-hosted Allure report, an
in-app tool to run test suites live, and a CI pipeline that gates all of it.

Jump straight to [the QA / test engineering feature set](#qa-feature-set),
[try it yourself](#try-it-yourself), or [the Kubernetes/Helm deployment](#kubernetes-helm).

---

## ✦ See it in motion

| The app | The Test Runner, live | The QA Report, self-hosted |
|---|---|---|
| ![Logging a ritual on the dashboard](readme-assets/demo-dashboard.gif) | ![Running the Playwright suite from the browser](readme-assets/demo-test-runner.gif) | ![The themed Allure report served in-app](readme-assets/demo-qa-report.gif) |

---

<a id="qa-feature-set"></a>
## ✦ QA / Test Engineering Feature Set

- **Playwright coverage, API and UI** — [`tests/api.spec.js`](tests/api.spec.js) and
  [`tests/smoke.spec.js`](tests/smoke.spec.js) exercise the REST surface and the real browser
  UI, grouped by feature with `test.describe()` and broken into named `step()`s so a report
  reads like a story, not just a pass/fail.
- **Page Object Model** — UI tests drive the app exclusively through
  [`tests/pages/RitualLedgerPage.js`](tests/pages/RitualLedgerPage.js), not raw locators
  scattered inline.
- **Allure annotations that mean something** — every test carries `epic` / `feature` /
  `story` / `severity` / `owner` tags (`allure-js-commons`), so the generated report is
  actually browsable by area and risk, not just a flat list of test names.
- **A themed, self-hosted Allure report** — the "Awesome" report is generated with
  `allure awesome`, then re-skinned post-generation ([`src/allure-theme.css`](src/allure-theme.css),
  [`src/themeAllureReport.js`](src/themeAllureReport.js)) to match the app's own void/pink/
  violet palette — deliberately *without* touching the pass/fail/broken/skipped status colors,
  since those carry standard QA meaning that shouldn't be sacrificed for branding.
- **Local run-history trends** — every regeneration appends to a local `data/allure-history.jsonl`
  via `--history-path` (gitignored — it's local run state, not repo content), so the report's
  trend charts show real run-over-run history, not a single snapshot.
- **An in-app Test Runner** — not just a `tests/` folder to take on faith. A "🧪 Test Runner"
  tab runs the real Playwright suite from the browser, streams output live over SSE, supports
  mid-run cancellation, and auto-regenerates the Allure report on completion.
- **CI that actually gates this** — [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
  runs lint, the full Playwright suite (with `eslint-plugin-playwright` catching
  Playwright-specific antipatterns like a missing `await` on `expect()`), and a Docker build
  in parallel on every PR, uploading the Playwright HTML and Allure reports as artifacts even
  when a run fails.

---

<a id="try-it-yourself"></a>
## ✦ Try it yourself

Don't just read the `tests/` folder — run it:

1. **Start the app** (see [Getting Started](#-getting-started) below), then open the
   **🧪 Test Runner** tab and hit **Run**. Watch the suite execute live, right in the browser.
2. Open the **🔬 QA Report** tab afterward to see the themed Allure report the run you just
   watched actually produced — full annotations, history trends, the works.
3. **Look at the Docker setup** — [`Dockerfile`](Dockerfile) is a multi-stage build on
   `node:22-alpine` with a non-root runtime user and build-only tooling (the `python3 make g++`
   toolchain `better-sqlite3` needs at install time) confined entirely to the builder stage.
   The final image bakes in a snapshot of the Allure report for fully self-contained hosting —
   `docker compose up` serves the whole thing, tests and all, with nothing external required.
4. **See it on Kubernetes** — [`k8s/`](k8s/) and [`helm/ritual-ledger/`](helm/ritual-ledger/)
   deploy the same app to a real cluster, with a `CronJob` re-running the test suite and Allure
   report on a schedule. [More below](#kubernetes-helm).

---

<a id="kubernetes-helm"></a>
## ✦ Kubernetes / Helm Deployment

Beyond Docker Compose: this repo also deploys to a real Kubernetes cluster — the same kind of
setup I deploy and maintain at my day job on a Helm-managed cluster, applied here to my own
project.

Two ways to look at it:

- **[`k8s/`](k8s/)** — raw, literal manifests. No templating, nothing hidden behind values —
  a `Namespace`, two `ServiceAccount`s, a `ConfigMap` for the plan file, two `PersistentVolumeClaim`s,
  a single-replica `Deployment`, a `Service`, a `CronJob`, and an optional `Ingress`. Read these
  first if you want to see exactly what's actually deployed.
- **[`helm/ritual-ledger/`](helm/ritual-ledger/)** — the same resource set, packaged as a proper
  Helm chart with a `values.yaml`, a `fail`-guarded single-replica constraint, and its own
  [README](helm/ritual-ledger/README.md) covering every value and the deliberate tradeoffs made.

**What's deployed:** the app (fixed at `replicas: 1` — `better-sqlite3` runs in WAL mode, a
single-process, single-writer embedded database, so there's no HPA here, on purpose) behind a
`ClusterIP` Service; a `CronJob` that runs the full Playwright suite and regenerates the Allure
report on a schedule, sharing two PVCs with the app so both the SQLite-adjacent run history and
the generated report persist and stay visible without a redeploy; a `ConfigMap`-mounted plan file
that live-updates the served Grimoire without a rollout (whole-directory mount, not `subPath` —
Kubernetes doesn't live-update `subPath`-mounted ConfigMaps); and an optional `Ingress`, off by
default.

**No registry yet — build and load locally:**
```bash
docker build --target runtime -t ritual-ledger:local .
docker build --target test-runner -t ritual-ledger-test-runner:local .
kind create cluster
kind load docker-image ritual-ledger:local ritual-ledger-test-runner:local
kubectl apply -f k8s/
# or: helm install ritual-ledger helm/ritual-ledger --create-namespace --namespace ritual-ledger
kubectl -n ritual-ledger port-forward svc/ritual-ledger 8080:80
curl http://localhost:8080/api/health
```

**Honestly verified, not just written:** every manifest and the chart were validated against a
real local [kind](https://kind.sigs.k8s.io/) cluster while building this — `helm lint`, rendered
output applied for real, the Deployment actually reaching `Ready`, the `CronJob`'s `Job` triggered
manually and watched through to a completed test run and a regenerated report the app pod then
served over the shared PVC, and a `helm uninstall` confirmed to keep the data PVCs (they carry
`helm.sh/resource-policy: keep`, since Helm deletes templated PVCs by default otherwise — a real
gotcha this process caught, not a hypothetical one). No cluster is kept running for this repo
day-to-day, so treat the above as a tested recipe, not a live deployment.

Known, deliberate tradeoffs (documented in depth in the [chart README](helm/ritual-ledger/README.md)):
single-node-cluster-only `ReadWriteOnce` storage, `readOnlyRootFilesystem` intentionally left
`false` (a real code path writes to the image filesystem at runtime), and no container registry
integration yet.

---

## ✦ What the app does

- **Ritual Log** — log workout sessions (duration, energy, notes), edit or delete them later.
- **Body & Vessel** — track bodyweight and body measurements over time.
- **Lift Progress** — log lifts with sets/reps/weight and an "ordeal level" difficulty rating.
- **Grimoire of Strength** — a printable, illuminated-manuscript-styled rendition of a
  workout plan, generated straight from a plain-markdown source file
  ([`custom-workout-plan.md`](custom-workout-plan.md)) via a small parser/generator pipeline.
- **Data export/import** — full JSON backup and restore.

---

## ✦ Tech Stack

**App:** Node.js, Express, `better-sqlite3`, vanilla JS (no frontend framework) · **Testing:**
Playwright, `allure-js-commons`/`allure-playwright`, ESLint + `eslint-plugin-playwright` ·
**Reporting:** Allure "Awesome" report, themed and self-hosted · **CI/CD:** GitHub Actions ·
**Containerization:** Docker (multi-stage, Alpine, non-root), Kubernetes, Helm

---

## ✦ Getting Started

**Locally:**
```bash
npm install
npm start
# → http://localhost:3000
```

**With Docker** (bakes in a snapshot of the Allure report for a fully self-contained image):
```bash
npm run docker:build   # ensures a report snapshot exists, then builds the image
docker compose up
```

## ✦ Running the QA tooling locally

```bash
npm run test:e2e:report   # run the full Playwright suite, then regenerate the Allure report
npm run allure:open       # open the generated report directly
```

Or skip the terminal entirely and use the in-app **🧪 Test Runner** tab described above.

---

## ✦ A note on the QA Report

The Allure "Awesome" report bundles its own Google Analytics snippet by default — that's
Allure's own toolchain telemetry, not anything added by this project, and no supported
opt-out was found. Worth knowing if you're serving `/allure-report` publicly yourself.

---

## ✦ License

[MIT](LICENSE)

---

## ✦ Why I Built This

I'm a senior QA engineer with over 10 years of experience in test planning, execution, and automation. I advocate for and specialize in a shift-left testing strategy with a focus on building and automating test coverage across the entire system. Invest in quality at the foundational level, then enjoy the magic. ✨

---

<p align="center"><i>✦ so mote it be ✦</i></p>
