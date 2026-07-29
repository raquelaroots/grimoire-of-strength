"use strict";

const { test, expect } = require("@playwright/test");

test("dashboard loads with no connection banner", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#storageBanner")).not.toHaveClass(/show/);
  await expect(page.locator('nav.tabs button[data-tab="dashboard"]')).toHaveClass(/active/);
});

test("log a ritual entry and see it reflected on the dashboard and log table", async ({ page }) => {
  await page.goto("/");

  const totalBefore = parseInt((await page.locator("#statTotal").textContent()) || "0", 10);

  await page.locator('nav.tabs button[data-tab="log"]').click();
  await page.locator("#openLogForm").click();
  await expect(page.locator("#logForm")).toHaveClass(/open/);

  await page.locator("#logDate").fill("2026-03-03");
  await page.locator("#logWorkout").selectOption("1A");
  await page.locator("#logDuration").fill("28");
  await page.locator("#logNotes").fill("playwright smoke test entry");
  await page.locator("#saveLogBtn").click();

  await expect(page.locator("#logForm")).not.toHaveClass(/open/);
  await expect(page.locator("#logTable tbody")).toContainText("playwright smoke test entry");

  await page.locator('nav.tabs button[data-tab="dashboard"]').click();
  await expect(page.locator("#statTotal")).toHaveText(String(totalBefore + 1));
});

test("cycle badge matches the app's own week-parity calculation", async ({ page }) => {
  await page.goto("/");
  const expected = await page.evaluate(() => {
    function isoWeekNumber(d) {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = (date.getUTCDay() + 6) % 7;
      date.setUTCDate(date.getUTCDate() - dayNum + 3);
      const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
      return 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
    }
    const wk = isoWeekNumber(new Date());
    return (wk % 2 === 0) ? "B" : "A";
  });
  await expect(page.locator("#cycleLabel")).toHaveText("Week " + expected);
});

test("edit a lift entry: sets and ordeal level round-trip through the form", async ({ page }) => {
  await page.goto("/");
  await page.locator('nav.tabs button[data-tab="lifts"]').click();
  await page.locator("#openLiftForm").click();

  await page.locator("#liftDate").fill("2026-04-04");
  await page.locator("#liftExercise").selectOption("Overhead Press");
  await page.locator("#liftWeight").fill("20");
  await page.locator("#liftSets").fill("3");
  await page.locator("#liftReps").fill("8");
  await page.locator('#difficultySelect button[data-val="2"]').click();
  await page.locator("#saveLiftBtn").click();

  const row = page.locator("#liftTable tbody tr", { hasText: "Overhead Press" }).first();
  await expect(row).toContainText("3");
  await expect(row.locator("td").nth(5)).toHaveText("🗡️🗡️");

  await row.locator("[data-edit]").click();
  await expect(page.locator("#liftForm")).toHaveClass(/open/);
  await expect(page.locator("#liftSets")).toHaveValue("3");
  await page.locator("#liftSets").fill("5");
  await page.locator('#difficultySelect button[data-val="4"]').click();
  await page.locator("#saveLiftBtn").click();

  const updatedRow = page.locator("#liftTable tbody tr", { hasText: "Overhead Press" }).first();
  await expect(updatedRow.locator("td").nth(3)).toHaveText("5");
  await expect(updatedRow.locator("td").nth(5)).toHaveText("🗡️🗡️🗡️🗡️");
});

test("grimoire tab loads the generated grimoire in an iframe", async ({ page }) => {
  await page.goto("/");
  await page.locator('nav.tabs button[data-tab="grimoire"]').click();
  await expect(page.locator("#view-grimoire")).toHaveClass(/active/);

  const frame = page.frameLocator("#grimoireFrame");
  await expect(frame.locator("h1.title")).toHaveText("Grimoire of Strength");
});
