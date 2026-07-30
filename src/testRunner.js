"use strict";

// Only ever require()'d from server.js inside its TEST_RUNNER_AVAILABLE guard,
// which already confirmed tree-kill and @playwright/test resolve — so the
// requires below are guaranteed safe by the time this module loads.

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const treeKill = require("tree-kill");

const REPO_ROOT = path.join(__dirname, "..");
const TESTS_DIR = path.join(REPO_ROOT, "tests");
const ALL_SUITE_ID = "__all__";
const MAX_BUFFER_LINES = 5000;
const MAX_LINE_CHARS = 4000;
const CANCEL_GRACE_MS = 5000;

// Strips ANSI escape sequences (color codes, cursor movement) from captured
// output before it reaches the browser. Built via RegExp(string) rather than
// a /regex literal/ with embedded control characters, since raw control
// bytes don't survive some text pipelines intact.
const ANSI_RE = new RegExp("[\\x1B\\x9B][[\\]()#;?]*(?:\\d{1,4}(?:;\\d{0,4})*)?[a-zA-Z]", "g");

// SSE clients persist across runs — only the per-run fields below get reset
// when a new run starts, so an already-connected browser keeps receiving
// events across multiple runs instead of being silently orphaned.
const clients = new Set();

function freshRunState() {
  return {
    status: "idle", // idle | running | cancelled | regenerating | completed | regen_failed | failed_to_start
    suiteId: null,
    suiteLabel: null,
    startedAt: null,
    endedAt: null,
    exitCode: null,
    cancelRequested: false,
    child: null,
    seq: 0,
    buffer: [],
  };
}

let state = freshRunState();

function listSuites() {
  const files = fs.readdirSync(TESTS_DIR).filter((f) => f.endsWith(".spec.js"));
  const suites = files.sort().map((f) => ({ id: f.replace(/\.spec\.js$/, ""), file: f, label: f }));
  suites.push({ id: ALL_SUITE_ID, file: null, label: "All tests" });
  return suites;
}

function resolveSuite(suiteId) {
  return listSuites().find((s) => s.id === suiteId) || null;
}

function serialize() {
  return {
    status: state.status,
    suiteId: state.suiteId,
    suiteLabel: state.suiteLabel,
    startedAt: state.startedAt,
    endedAt: state.endedAt,
    exitCode: state.exitCode,
  };
}

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(payload);
}

function emitLine(stream, text) {
  if (text.length > MAX_LINE_CHARS) text = text.slice(0, MAX_LINE_CHARS) + " …[truncated]";
  const evt = { seq: ++state.seq, stream, text };
  state.buffer.push(evt);
  if (state.buffer.length > MAX_BUFFER_LINES) state.buffer.shift();
  broadcast("line", evt);
}

function makeLineSplitter(streamName) {
  let carry = "";
  return (chunk) => {
    carry += chunk.toString("utf8");
    const lines = carry.split("\n");
    carry = lines.pop();
    lines.forEach((l) => emitLine(streamName, l.replace(ANSI_RE, "")));
  };
}

function findPackageRoot(fromFile) {
  let dir = path.dirname(fromFile);
  while (!fs.existsSync(path.join(dir, "package.json"))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`could not locate package.json above ${fromFile}`);
    dir = parent;
  }
  return dir;
}

function resolvePlaywrightCli() {
  const pkgJsonPath = require.resolve("@playwright/test/package.json", { paths: [REPO_ROOT] });
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.playwright;
  return path.join(path.dirname(pkgJsonPath), bin);
}

function resolveAllureCli() {
  // allure's package.json declares an "exports" map that blocks subpath
  // requires like "allure/package.json" or "allure/cli.js" from outside the
  // package. Its main entry ("." ) IS exported, so we resolve that instead,
  // then walk up to find package.json via plain fs access — fs reads aren't
  // subject to the exports-map restriction, only require()/import are.
  const entry = require.resolve("allure", { paths: [REPO_ROOT] });
  const root = findPackageRoot(entry);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.allure;
  return path.join(root, bin);
}

function buildTestArgs(suite) {
  const args = ["test"];
  // Always forward-slash, even on Windows: Playwright treats this argument
  // as a regex/glob matched against its internally-recorded (POSIX-style)
  // file paths, so a path.join()-produced "tests\\api.spec.js" silently
  // matches zero files there — this must NOT use path.join/path.sep.
  if (suite.file) args.push("tests/" + suite.file);
  return args;
}

function runStep(execPath, args) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(execPath, args, {
        cwd: REPO_ROOT,
        env: Object.assign({}, process.env, { FORCE_COLOR: "0" }),
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch (err) {
      emitLine("stderr", "Failed to start process: " + err.message);
      resolve(1);
      return;
    }
    child.stdout.on("data", makeLineSplitter("stdout"));
    child.stderr.on("data", makeLineSplitter("stderr"));
    child.on("error", (err) => emitLine("stderr", "Process error: " + err.message));
    child.on("close", (code) => resolve(code));
  });
}

async function regenerateAllureReport() {
  state.status = "regenerating";
  broadcast("status", serialize());

  // Mirrors the "allure:generate" npm script's three steps exactly — kept in
  // sync manually since npm scripts can't share a JS args array with this
  // module; if those flags ever change in package.json, update here too.
  const steps = [
    [process.execPath, [path.join(REPO_ROOT, "src", "cleanAllureReport.js")]],
    [
      process.execPath,
      [
        resolveAllureCli(),
        "awesome",
        "./allure-results",
        "--output",
        "./allure-report",
        "--theme",
        "dark",
        "--report-name",
        "Ritual Ledger QA Report",
        "--logo",
        "/assets/allure-logo.svg",
      ],
    ],
    [process.execPath, [path.join(REPO_ROOT, "src", "themeAllureReport.js")]],
  ];

  for (const [exe, args] of steps) {
    const code = await runStep(exe, args);
    if (code !== 0) {
      state.status = "regen_failed";
      state.endedAt = new Date().toISOString();
      broadcast("status", serialize());
      return;
    }
  }

  state.status = "completed";
  state.endedAt = new Date().toISOString();
  broadcast("status", serialize());
}

function startRun(suite) {
  state = freshRunState();
  state.status = "running";
  state.suiteId = suite.id;
  state.suiteLabel = suite.label;
  state.startedAt = new Date().toISOString();

  let child;
  try {
    child = spawn(process.execPath, [resolvePlaywrightCli(), ...buildTestArgs(suite)], {
      cwd: REPO_ROOT,
      env: Object.assign({}, process.env, { FORCE_COLOR: "0" }),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  } catch (err) {
    state.status = "failed_to_start";
    state.endedAt = new Date().toISOString();
    emitLine("stderr", "Failed to start test run: " + err.message);
    broadcast("status", serialize());
    return;
  }

  state.child = child;
  child.stdout.on("data", makeLineSplitter("stdout"));
  child.stderr.on("data", makeLineSplitter("stderr"));
  child.on("error", (err) => emitLine("stderr", "Test process error: " + err.message));

  child.on("close", (code) => {
    state.child = null;
    state.exitCode = code;

    if (state.cancelRequested) {
      state.status = "cancelled";
      state.endedAt = new Date().toISOString();
      broadcast("status", serialize());
      return;
    }

    regenerateAllureReport();
  });

  broadcast("status", serialize());
}

function cancelActiveRun() {
  if (state.status !== "running" || !state.child) return false;
  state.cancelRequested = true;
  const pid = state.child.pid;

  treeKill(pid, "SIGTERM", (err) => {
    if (err) treeKill(pid, "SIGKILL", () => {});
  });

  setTimeout(() => {
    if (state.status === "running") treeKill(pid, "SIGKILL", () => {});
  }, CANCEL_GRACE_MS);

  return true;
}

function killActiveRun() {
  if (state.child) {
    try {
      treeKill(state.child.pid, "SIGKILL", () => {});
    } catch (err) {
      // best-effort on shutdown
    }
  }
}

function registerRoutes(app) {
  app.get("/api/test-runner/suites", (req, res) => {
    res.json({ suites: listSuites() });
  });

  app.get("/api/test-runner/status", (req, res) => {
    res.json(serialize());
  });

  app.get("/api/test-runner/stream", (req, res) => {
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.flushHeaders();

    res.write(`event: status\ndata: ${JSON.stringify(serialize())}\n\n`);
    for (const line of state.buffer) res.write(`event: line\ndata: ${JSON.stringify(line)}\n\n`);

    clients.add(res);
    const heartbeat = setInterval(() => res.write(":\n\n"), 20000);

    req.on("close", () => {
      clearInterval(heartbeat);
      clients.delete(res);
    });
  });

  app.post("/api/test-runner/run", (req, res) => {
    if (state.status === "running" || state.status === "regenerating") {
      return res.status(409).json({ error: "A test run is already in progress." });
    }
    const suite = resolveSuite(req.body && req.body.suiteId);
    if (!suite) return res.status(400).json({ error: "Unknown suiteId." });
    startRun(suite);
    res.status(202).json(serialize());
  });

  app.post("/api/test-runner/cancel", (req, res) => {
    if (state.status !== "running") return res.status(409).json({ error: "No run in progress." });
    cancelActiveRun();
    res.json({ status: "cancelling" });
  });
}

module.exports = { registerRoutes, killActiveRun };
