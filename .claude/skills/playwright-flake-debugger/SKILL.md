---
name: playwright-flake-debugger
description: >
  Use this skill for diagnosing flaky Playwright tests, intermittent failures,
  timing issues, and unstable selectors. Prefer it when tests pass locally but
  fail in CI or behave inconsistently.
---

# Playwright Flake Debugger

Use this skill to identify and eliminate flaky behavior in :contentReference[oaicite:1]{index=1} tests.

## Goals

- Make tests deterministic.
- Remove timing-based failures.
- Stabilize selectors and async behavior.

## Workflow

1. Classify the failure:
   - timing issue
   - selector instability
   - network dependency
   - shared state pollution
2. Replace timing assumptions:
   - remove `waitForTimeout`
   - use `expect(...).toBeVisible()`
3. Validate locators:
   - prefer semantic locators
   - remove fragile CSS/XPath
4. Inspect async behavior:
   - ensure all promises are awaited
   - eliminate race conditions
5. Stabilize network:
   - mock API calls with `page.route`
6. Use debugging tools:
   - trace viewer
   - `--headed`
   - `--debug`

## Rules

- Retries are not a fix for flakiness.
- Always identify the root cause category.
- Do not introduce longer timeouts as a solution.
- Prefer deterministic mocks over live dependencies.

## Output style

- State the root cause clearly.
- Show a minimal fix.
- Provide corrected code snippets.
