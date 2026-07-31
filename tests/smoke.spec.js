"use strict";

const { test, expect } = require("@playwright/test");
const { epic, feature, story, severity, owner, step, Severity } = require("allure-js-commons");
const { RitualLedgerPage } = require("./pages/RitualLedgerPage");

test.describe("Ritual Ledger UI", () => {
  test.beforeEach(async ({ page }) => {
    await epic("Ritual Ledger UI");
    await owner("raquela");
    const app = new RitualLedgerPage(page);
    await app.goto();
  });

  test.describe("Dashboard", () => {
    test("loads with no connection banner", async ({ page }) => {
      await feature("Dashboard");
      await severity(Severity.BLOCKER);

      const app = new RitualLedgerPage(page);
      await expect(app.storageBanner).not.toHaveClass(/show/);
      await expect(app.activeTabButton("dashboard")).toHaveClass(/active/);
    });

    test("cycle badge matches the app's own week-parity calculation", async ({ page }) => {
      await feature("Dashboard");
      await story("Week A/B cycle badge");
      await severity(Severity.NORMAL);

      const app = new RitualLedgerPage(page);
      const expected = await step("compute expected week letter from ISO week parity", () =>
        page.evaluate(() => {
          function isoWeekNumber(d) {
            const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            const dayNum = (date.getUTCDay() + 6) % 7;
            date.setUTCDate(date.getUTCDate() - dayNum + 3);
            const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
            return 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
          }
          const wk = isoWeekNumber(new Date());
          return (wk % 2 === 0) ? "B" : "A";
        })
      );
      await step("cycle badge shows the expected week letter", async () => {
        await expect(app.cycleLabel).toHaveText("Week " + expected);
      });
    });
  });

  test.describe("Ritual Log", () => {
    test("log a ritual entry and see it reflected on the dashboard and log table", async ({ page }) => {
      await feature("Ritual Log");
      await story("Create a completion");
      await severity(Severity.CRITICAL);

      const app = new RitualLedgerPage(page);
      const totalBefore = parseInt((await app.statTotal.textContent()) || "0", 10);

      await step("open the log form and fill in an entry", async () => {
        await app.switchTab("log");
        await app.openLogForm();
        await expect(app.logForm).toHaveClass(/open/);
        await app.fillLogEntry({ date: "2026-03-03", workout: "1A", duration: 28, notes: "playwright smoke test entry" });
      });

      await step("save the entry", async () => {
        await app.saveLogEntry();
        await expect(app.logForm).not.toHaveClass(/open/);
      });

      await step("entry appears in the log table", async () => {
        await expect(app.logTable).toContainText("playwright smoke test entry");
      });

      await step("dashboard total increments by one", async () => {
        await app.switchTab("dashboard");
        await expect(app.statTotal).toHaveText(String(totalBefore + 1));
      });
    });

    test("edit a ritual log entry", async ({ page }) => {
      await feature("Ritual Log");
      await story("Edit a completion");
      await severity(Severity.CRITICAL);

      const app = new RitualLedgerPage(page);

      await step("create an entry to edit", async () => {
        await app.switchTab("log");
        await app.openLogForm();
        await app.fillLogEntry({ date: "2026-03-05", workout: "1A", duration: 20, notes: "before edit" });
        await app.saveLogEntry();
      });

      await step("reopen the entry via the edit button", async () => {
        await app.editLogRow("before edit");
        await expect(app.logForm).toHaveClass(/open/);
      });

      await step("change the notes and save", async () => {
        await app.fillLogEntry({ notes: "after edit" });
        await app.saveLogEntry();
      });

      await step("table reflects the edit, not the original", async () => {
        await expect(app.logTable).toContainText("after edit");
        await expect(app.logTable).not.toContainText("before edit");
      });
    });
  });

  test.describe("Lift Progress", () => {
    test("edit a lift entry: sets and ordeal level round-trip through the form", async ({ page }) => {
      await feature("Lift Progress");
      await story("Edit sets and difficulty");
      await severity(Severity.CRITICAL);

      const app = new RitualLedgerPage(page);

      await step("log a lift with sets, reps, and an ordeal level", async () => {
        await app.switchTab("lifts");
        await app.openLiftForm();
        await app.fillLiftEntry({ date: "2026-04-04", exercise: "Overhead Press", weight: 20, sets: 3, reps: 8, difficulty: 2 });
        await app.saveLiftEntry();
      });

      await step("table row shows the sets and ordeal level just logged", async () => {
        const row = app.liftRow("Overhead Press");
        await expect(row).toContainText("3");
        await expect(row.locator("td").nth(5)).toHaveText("🗡️🗡️");
      });

      await step("reopen the entry and change sets/ordeal level", async () => {
        await app.editLiftRow("Overhead Press");
        await expect(app.liftForm).toHaveClass(/open/);
        await expect(page.locator("#liftSets")).toHaveValue("3");
        await app.fillLiftEntry({ sets: 5, difficulty: 4 });
        await app.saveLiftEntry();
      });

      await step("table row reflects the updated values", async () => {
        const updatedRow = app.liftRow("Overhead Press");
        await expect(updatedRow.locator("td").nth(3)).toHaveText("5");
        await expect(updatedRow.locator("td").nth(5)).toHaveText("🗡️🗡️🗡️🗡️");
      });
    });
  });

  test.describe("Grimoire", () => {
    test("grimoire tab loads the generated grimoire in an iframe", async ({ page }) => {
      await feature("Grimoire Generation");
      await story("In-app Grimoire viewing");
      await severity(Severity.NORMAL);

      const app = new RitualLedgerPage(page);
      await app.switchTab("grimoire");
      await expect(app.activeView("grimoire")).toHaveClass(/active/);
      await expect(app.grimoireFrame.locator("h1.title")).toHaveText("Grimoire of Strength");
    });
  });

  test.describe("Test Runner", () => {
    test("tab becomes visible and lists the real suites, without triggering a run", async ({ page }) => {
      await feature("Test Runner");
      await story("Tab visibility and suite population");
      await severity(Severity.NORMAL);

      // Deliberately never clicks Run: this suite's own webServer already
      // occupies port 3100, and clicking Run would spawn a nested Playwright
      // run trying to start a second instance of that same webServer — a
      // reflexive conflict. The run/cancel/regenerate lifecycle itself was
      // verified manually instead (see project notes).
      const app = new RitualLedgerPage(page);

      await step("tab is unhidden once availability is confirmed", async () => {
        await expect(app.testRunnerTabBtn).toBeVisible();
      });

      await step("switching to it shows the suite picker and Run/Cancel controls", async () => {
        await app.switchTab("testrunner");
        await expect(app.activeView("testrunner")).toHaveClass(/active/);
        await expect(app.runTestsBtn).toBeEnabled();
        await expect(app.cancelTestsBtn).toBeDisabled();
      });

      await step("suite picker is populated from the real tests/ directory", async () => {
        await expect(app.suiteSelect.locator("option")).toHaveText(["api.spec.js", "smoke.spec.js", "All tests"]);
      });
    });
  });

  test.describe("QA Report", () => {
    test("QA report tab is wired to the served Allure report", async ({ page }) => {
      await feature("QA Report Serving");
      await story("App serves its own Allure report");
      await severity(Severity.MINOR);

      // Content is asserted lightly on purpose: allure-report/ is generated
      // by this very test run's own reporting step, so on a first-ever run
      // it may not exist yet when this test executes. We verify the tab and
      // iframe are correctly wired to the route, not the report's contents.
      const app = new RitualLedgerPage(page);
      await app.switchTab("qa");
      await expect(app.activeView("qa")).toHaveClass(/active/);
      // Switching to this tab always reloads the iframe with a cache-busting
      // ?t= param (see ritual-ledger.html's tab-click handler), so the src
      // is asserted by prefix rather than an exact match.
      await expect(app.qaReportFrame).toHaveAttribute("src", /^\/allure-report\/index\.html\?t=\d+$/);
    });

    test("revisiting the tab reloads the iframe fresh instead of reusing a stale instance", async ({ page }) => {
      await feature("QA Report Serving");
      await story("Iframe reloads on every tab visit");
      await severity(Severity.NORMAL);

      // Regression coverage for a real bug: the iframe only toggles CSS
      // visibility on tab switch, so without an explicit reload on every
      // visit, a report regenerated later (terminal, Test Runner, another
      // tab) leaves a stale SPA instance running against files that a
      // subsequent generation had already replaced — surfacing as
      // "failed to fetch" when clicking into a test or opening Graphs/Timeline.
      const app = new RitualLedgerPage(page);

      await app.switchTab("qa");
      const firstSrc = await app.qaReportFrame.getAttribute("src");

      await app.switchTab("dashboard");
      await app.switchTab("qa");
      const secondSrc = await app.qaReportFrame.getAttribute("src");

      // Comparing two captured values, not asserting a known expected one —
      // toHaveAttribute() has no equivalent for "changed since last read".
      // eslint-disable-next-line playwright/prefer-web-first-assertions
      expect(secondSrc).not.toBe(firstSrc);
    });
  });
});
