"use strict";

// Entrypoint for the Kubernetes CronJob's test-runner image (see the Dockerfile's
// `test-runner` stage and k8s/07-cronjob.yaml / helm/ritual-ledger/templates/cronjob.yaml).
//
// Runs the Playwright suite, then ALWAYS regenerates the Allure report — even if tests
// failed — and exits with the tests' own exit code (not the report step's), so a
// Kubernetes Job is observed as failed/succeeded based on test results, not report
// generation. Mirrors .github/workflows/ci.yml's `continue-on-error` + `if: always()`
// pattern; package.json's "test:e2e:report" script can't do this itself, since
// `playwright test && npm run allure:generate` short-circuits the report step via `&&`
// on a test failure.
//
// Deliberately reuses `npm run allure:generate` rather than re-listing its three steps
// here — src/testRunner.js's regenerateAllureReport() already duplicates that command
// once (with a comment admitting it's manually kept in sync); this script is a third
// call site, not a third copy.

const { spawnSync } = require("child_process");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: REPO_ROOT, stdio: "inherit", shell: true });
  return result.status === null ? 1 : result.status;
}

const testExitCode = run("npx", ["playwright", "test"]);
const reportExitCode = run("npm", ["run", "allure:generate"]);
if (reportExitCode !== 0) {
  console.error(`allure:generate exited ${reportExitCode} — the QA report may be stale or missing.`);
}

process.exit(testExitCode);
