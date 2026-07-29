"use strict";

class RitualLedgerPage {
  constructor(page) {
    this.page = page;
    this.storageBanner = page.locator("#storageBanner");
    this.statTotal = page.locator("#statTotal");
    this.cycleLabel = page.locator("#cycleLabel");
    this.logForm = page.locator("#logForm");
    this.logTable = page.locator("#logTable tbody");
    this.liftForm = page.locator("#liftForm");
    this.liftTable = page.locator("#liftTable tbody");
    this.grimoireFrame = page.frameLocator("#grimoireFrame");
  }

  async goto() {
    await this.page.goto("/");
  }

  async switchTab(tab) {
    await this.page.locator(`nav.tabs button[data-tab="${tab}"]`).click();
  }

  activeTabButton(tab) {
    return this.page.locator(`nav.tabs button[data-tab="${tab}"]`);
  }

  activeView(tab) {
    return this.page.locator(`#view-${tab}`);
  }

  // ---------------- Ritual Log ----------------

  async openLogForm() {
    await this.page.locator("#openLogForm").click();
  }

  async fillLogEntry({ date, workout, duration, notes }) {
    if (date !== undefined) await this.page.locator("#logDate").fill(date);
    if (workout !== undefined) await this.page.locator("#logWorkout").selectOption(workout);
    if (duration !== undefined) await this.page.locator("#logDuration").fill(String(duration));
    if (notes !== undefined) await this.page.locator("#logNotes").fill(notes);
  }

  async saveLogEntry() {
    await this.page.locator("#saveLogBtn").click();
  }

  logRow(text) {
    return this.logTable.locator("tr", { hasText: text });
  }

  editLogRow(text) {
    return this.logRow(text).locator("[data-edit]").click();
  }

  // ---------------- Lift Progress ----------------

  async openLiftForm() {
    await this.page.locator("#openLiftForm").click();
  }

  async fillLiftEntry({ date, exercise, weight, sets, reps, difficulty }) {
    if (date !== undefined) await this.page.locator("#liftDate").fill(date);
    if (exercise !== undefined) await this.page.locator("#liftExercise").selectOption(exercise);
    if (weight !== undefined) await this.page.locator("#liftWeight").fill(String(weight));
    if (sets !== undefined) await this.page.locator("#liftSets").fill(String(sets));
    if (reps !== undefined) await this.page.locator("#liftReps").fill(String(reps));
    if (difficulty !== undefined) await this.setDifficulty(difficulty);
  }

  async setDifficulty(value) {
    await this.page.locator(`#difficultySelect button[data-val="${value}"]`).click();
  }

  async saveLiftEntry() {
    await this.page.locator("#saveLiftBtn").click();
  }

  liftRow(text) {
    return this.liftTable.locator("tr", { hasText: text }).first();
  }

  async editLiftRow(text) {
    await this.liftRow(text).locator("[data-edit]").click();
  }
}

module.exports = { RitualLedgerPage };
