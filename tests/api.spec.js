"use strict";

const { test, expect } = require("@playwright/test");

test("health check responds ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toEqual({ ok: true });
});

test("completions: create, edit, list, delete round trip", async ({ request }) => {
  const created = await request.post("/api/completions", {
    data: { date: "2026-01-01", workout: "1A", duration: 28, energy: 4, notes: "test entry" },
  });
  expect(created.ok()).toBeTruthy();
  const record = await created.json();
  expect(record.id).toBeTruthy();

  const listed = await (await request.get("/api/data")).json();
  expect(listed.completions.some((c) => c.id === record.id)).toBeTruthy();

  const updated = await request.put(`/api/completions/${record.id}`, {
    data: { date: "2026-01-01", workout: "1A", duration: 30, energy: 5, notes: "edited entry" },
  });
  expect(updated.ok()).toBeTruthy();
  const afterEdit = await (await request.get("/api/data")).json();
  const editedRecord = afterEdit.completions.find((c) => c.id === record.id);
  expect(editedRecord.notes).toBe("edited entry");
  expect(editedRecord.duration).toBe(30);

  const deleted = await request.delete(`/api/completions/${record.id}`);
  expect(deleted.status()).toBe(204);

  const after = await (await request.get("/api/data")).json();
  expect(after.completions.some((c) => c.id === record.id)).toBeFalsy();
});

test("bodyweight: create, list, delete round trip", async ({ request }) => {
  const created = await request.post("/api/bodyweight", {
    data: { date: "2026-01-01", weight: 150.5, unit: "lb" },
  });
  const record = await created.json();
  expect(record.id).toBeTruthy();

  const deleted = await request.delete(`/api/bodyweight/${record.id}`);
  expect(deleted.status()).toBe(204);
});

test("lifts: create, edit (sets/difficulty), list, delete round trip", async ({ request }) => {
  const created = await request.post("/api/lifts", {
    data: { date: "2026-01-01", exercise: "Romanian Deadlift", weight: 25, sets: 3, reps: 10, difficulty: 3 },
  });
  const record = await created.json();
  expect(record.id).toBeTruthy();
  expect(record.sets).toBe(3);
  expect(record.difficulty).toBe(3);

  const updated = await request.put(`/api/lifts/${record.id}`, {
    data: { date: "2026-01-01", exercise: "Romanian Deadlift", weight: 30, sets: 4, reps: 8, difficulty: 5 },
  });
  expect(updated.ok()).toBeTruthy();
  const editedRecord = await updated.json();
  expect(editedRecord.weight).toBe(30);
  expect(editedRecord.sets).toBe(4);
  expect(editedRecord.difficulty).toBe(5);

  const deleted = await request.delete(`/api/lifts/${record.id}`);
  expect(deleted.status()).toBe(204);
});

test("measurements: create, list, delete round trip", async ({ request }) => {
  const created = await request.post("/api/measurements", {
    data: { date: "2026-01-01", metric: "Waist", value: 30.5, unit: "in" },
  });
  const record = await created.json();
  expect(record.id).toBeTruthy();

  const deleted = await request.delete(`/api/measurements/${record.id}`);
  expect(deleted.status()).toBe(204);
});

test("plan: regenerate and fetch structured plan", async ({ request }) => {
  const regenerated = await request.post("/api/plan/regenerate");
  expect(regenerated.ok()).toBeTruthy();

  const plan = await (await request.get("/api/plan")).json();
  const codes = plan.workouts.map((w) => w.code).sort();
  expect(codes).toEqual(["1A", "1B", "2A", "2B"]);
});

test("export/import/clear round trip", async ({ request }) => {
  await request.post("/api/completions", {
    data: { date: "2026-02-02", workout: "charm", duration: 10, energy: 3, notes: "export test" },
  });

  const exported = await (await request.get("/api/export")).json();
  expect(exported.completions.some((c) => c.notes === "export test")).toBeTruthy();

  const cleared = await request.post("/api/clear");
  expect(cleared.ok()).toBeTruthy();
  const afterClear = await (await request.get("/api/data")).json();
  expect(afterClear.completions).toEqual([]);
  expect(afterClear.bodyweight).toEqual([]);
  expect(afterClear.lifts).toEqual([]);
  expect(afterClear.measurements).toEqual([]);

  const imported = await request.post("/api/import", { data: exported });
  expect(imported.ok()).toBeTruthy();
  const afterImport = await (await request.get("/api/data")).json();
  expect(afterImport.completions.some((c) => c.notes === "export test")).toBeTruthy();

  await request.post("/api/clear");
});
