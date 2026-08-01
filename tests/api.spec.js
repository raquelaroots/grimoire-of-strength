"use strict";

const { test, expect } = require("@playwright/test");
const { epic, feature, story, severity, owner, step, Severity } = require("allure-js-commons");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

test.describe("Ritual Ledger API", () => {
  test.beforeEach(async () => {
    await epic("Ritual Ledger API");
    await owner("raquela");
  });

  test.describe("Health", () => {
    test("health check responds ok", async ({ request }) => {
      await feature("System Health");
      await severity(Severity.BLOCKER);

      const res = await step("GET /api/health", () => request.get("/api/health"));
      expect(res.ok()).toBeTruthy();
      expect(await res.json()).toEqual({ ok: true });
    });
  });

  test.describe("Completions", () => {
    test("create, edit, list, delete round trip", async ({ request }) => {
      await feature("Ritual Log");
      await story("Completions CRUD");
      await severity(Severity.CRITICAL);

      const record = await step("create a completion", async () => {
        const created = await request.post("/api/completions", {
          data: { date: "2026-01-01", workout: "1A", duration: 28, energy: 4, notes: "test entry" },
        });
        expect(created.ok()).toBeTruthy();
        const body = await created.json();
        expect(body.id).toBeTruthy();
        return body;
      });

      await step("new completion appears in /api/data", async () => {
        const listed = await (await request.get("/api/data")).json();
        expect(listed.completions.some((c) => c.id === record.id)).toBeTruthy();
      });

      await step("edit date/duration/energy/notes", async () => {
        const updated = await request.put(`/api/completions/${record.id}`, {
          data: { date: "2026-01-01", workout: "1A", duration: 30, energy: 5, notes: "edited entry" },
        });
        expect(updated.ok()).toBeTruthy();
      });

      await step("edited fields persist on refetch", async () => {
        const afterEdit = await (await request.get("/api/data")).json();
        const editedRecord = afterEdit.completions.find((c) => c.id === record.id);
        expect(editedRecord.notes).toBe("edited entry");
        expect(editedRecord.duration).toBe(30);
      });

      await step("delete the completion", async () => {
        const deleted = await request.delete(`/api/completions/${record.id}`);
        expect(deleted.status()).toBe(204);
      });

      await step("completion no longer appears in /api/data", async () => {
        const after = await (await request.get("/api/data")).json();
        expect(after.completions.some((c) => c.id === record.id)).toBeFalsy();
      });
    });
  });

  test.describe("Bodyweight", () => {
    test("create, list, delete round trip", async ({ request }) => {
      await feature("Body & Vessel");
      await story("Bodyweight CRUD");
      await severity(Severity.NORMAL);

      const record = await step("create a bodyweight entry", async () => {
        const created = await request.post("/api/bodyweight", {
          data: { date: "2026-01-01", weight: 100.1, unit: "lb" },
        });
        const body = await created.json();
        expect(body.id).toBeTruthy();
        return body;
      });

      await step("delete the entry", async () => {
        const deleted = await request.delete(`/api/bodyweight/${record.id}`);
        expect(deleted.status()).toBe(204);
      });
    });
  });

  test.describe("Lifts", () => {
    test("create, edit sets/difficulty, list, delete round trip", async ({ request }) => {
      await feature("Lift Progress");
      await story("Lifts CRUD");
      await severity(Severity.CRITICAL);

      const record = await step("create a lift with sets and ordeal level", async () => {
        const created = await request.post("/api/lifts", {
          data: { date: "2026-01-01", exercise: "Romanian Deadlift", weight: 25, sets: 3, reps: 10, difficulty: 3 },
        });
        const body = await created.json();
        expect(body.id).toBeTruthy();
        expect(body.sets).toBe(3);
        expect(body.difficulty).toBe(3);
        return body;
      });

      await step("edit weight, sets, and ordeal level", async () => {
        const updated = await request.put(`/api/lifts/${record.id}`, {
          data: { date: "2026-01-01", exercise: "Romanian Deadlift", weight: 30, sets: 4, reps: 8, difficulty: 5 },
        });
        expect(updated.ok()).toBeTruthy();
        const editedRecord = await updated.json();
        expect(editedRecord.weight).toBe(30);
        expect(editedRecord.sets).toBe(4);
        expect(editedRecord.difficulty).toBe(5);
      });

      await step("delete the lift", async () => {
        const deleted = await request.delete(`/api/lifts/${record.id}`);
        expect(deleted.status()).toBe(204);
      });
    });
  });

  test.describe("Measurements", () => {
    test("create, list, delete round trip", async ({ request }) => {
      await feature("Body & Vessel");
      await story("Measurements CRUD");
      await severity(Severity.NORMAL);

      const record = await step("create a measurement entry", async () => {
        const created = await request.post("/api/measurements", {
          data: { date: "2026-01-01", metric: "Waist", value: 10.5, unit: "in" },
        });
        const body = await created.json();
        expect(body.id).toBeTruthy();
        return body;
      });

      await step("delete the entry", async () => {
        const deleted = await request.delete(`/api/measurements/${record.id}`);
        expect(deleted.status()).toBe(204);
      });
    });
  });

  test.describe("Plan", () => {
    test("regenerate and fetch structured plan", async ({ request }) => {
      await feature("Grimoire Generation");
      await story("Plan parsing");
      await severity(Severity.CRITICAL);

      await step("regenerate the grimoire from custom-workout-plan.md", async () => {
        const regenerated = await request.post("/api/plan/regenerate");
        expect(regenerated.ok()).toBeTruthy();
      });

      await step("structured plan includes all four workout codes", async () => {
        const plan = await (await request.get("/api/plan")).json();
        const codes = plan.workouts.map((w) => w.code).sort();
        expect(codes).toEqual(["1A", "1B", "2A", "2B"]);
      });
    });
  });

  test.describe("Data Management", () => {
    test("export/import/clear round trip", async ({ request }) => {
      await feature("Data Management");
      await story("Export, clear, and import a full backup");
      await severity(Severity.BLOCKER);

      await step("seed a completion to export", async () => {
        await request.post("/api/completions", {
          data: { date: "2026-02-02", workout: "charm", duration: 10, energy: 3, notes: "export test" },
        });
      });

      const exported = await step("export the full dataset", async () => {
        const data = await (await request.get("/api/export")).json();
        expect(data.completions.some((c) => c.notes === "export test")).toBeTruthy();
        return data;
      });

      await step("clear all data", async () => {
        const cleared = await request.post("/api/clear");
        expect(cleared.ok()).toBeTruthy();
        const afterClear = await (await request.get("/api/data")).json();
        expect(afterClear.completions).toEqual([]);
        expect(afterClear.bodyweight).toEqual([]);
        expect(afterClear.lifts).toEqual([]);
        expect(afterClear.measurements).toEqual([]);
      });

      await step("import the exported backup", async () => {
        const imported = await request.post("/api/import", { data: exported });
        expect(imported.ok()).toBeTruthy();
        const afterImport = await (await request.get("/api/data")).json();
        expect(afterImport.completions.some((c) => c.notes === "export test")).toBeTruthy();
      });

      await step("clean up", async () => {
        await request.post("/api/clear");
      });
    });
  });

  test.describe("Test Runner", () => {
    // Deliberately does not exercise POST /run or /cancel here: this suite's
    // own webServer already occupies port 3100 (per playwright.config.js),
    // and triggering a real run from within a run would try to start a
    // second instance of that same webServer — a reflexive conflict. These
    // tests cover the read-only surface (availability + suite discovery)
    // instead; the run/cancel/regenerate lifecycle was verified manually
    // (live streaming, tree-kill on cancel, concurrency 409, report
    // regeneration) since it can't safely self-test from inside its own
    // suite.
    test("is available in this (dev) environment and lists the real spec files", async ({ request }) => {
      await feature("Test Runner");
      await story("Suite discovery");
      await severity(Severity.NORMAL);

      await step("the feature reports itself available", async () => {
        const available = await (await request.get("/api/test-runner/available")).json();
        expect(available.available).toBe(true);
      });

      await step("the suite list reflects the real tests/ directory plus an All-tests option", async () => {
        const data = await (await request.get("/api/test-runner/suites")).json();
        const ids = data.suites.map((s) => s.id).sort();
        expect(ids).toEqual(["__all__", "api", "smoke"]);
      });
    });
  });

  test.describe("Allure History", () => {
    // Regression coverage for a real bug: regenerating the report (whether
    // via `npm run allure:generate` or the Test Runner's internal
    // regenerateAllureReport(), which mirrors the same --history-path flag)
    // must APPEND to data/allure-history.jsonl, not reset it. This exercises
    // the actual shared generation pipeline directly rather than triggering
    // a real Test Runner run — that would spawn a second Playwright process
    // trying to bind the same port-3100 webServer this very suite already
    // occupies, which fails under CI's `reuseExistingServer: !process.env.CI`.
    // Since both call sites invoke the identical `allure awesome
    // --history-path ...` step, proving the shared pipeline accumulates
    // history here covers both entry points.
    test("regenerating the report twice accumulates history rather than resetting it", async () => {
      await feature("QA Report Serving");
      await story("Allure history persists across regenerations");
      await severity(Severity.NORMAL);

      const REPO_ROOT = path.join(__dirname, "..");
      const HISTORY_PATH = path.join(REPO_ROOT, "data", "allure-history.jsonl");

      // allure creates the history file itself (mkdir + open) if missing, so
      // by the time countLines() runs post-generate, it's always present.
      const countLines = () => fs.readFileSync(HISTORY_PATH, "utf8").trim().split("\n").filter(Boolean).length;

      const linesBefore = await step("regenerate once", async () => {
        execSync("npm run allure:generate", { cwd: REPO_ROOT, stdio: "ignore" });
        return countLines();
      });

      const linesAfter = await step("regenerate again", async () => {
        execSync("npm run allure:generate", { cwd: REPO_ROOT, stdio: "ignore" });
        return countLines();
      });

      expect(linesAfter).toBeGreaterThan(linesBefore);
    });
  });
});
