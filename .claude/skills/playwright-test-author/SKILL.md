---
name: playwright-test-author
description: >
  Use this skill for writing or reviewing Playwright tests, improving test
  structure, choosing locators, and enforcing reliability best practices.
  Prefer it when the task involves test creation, assertions, or UI flows.
---

# Playwright Test Author

Use this skill to write clean, reliable, and maintainable tests with :contentReference[oaicite:0]{index=0}.

## Goals

- Eliminate flaky tests.
- Keep tests readable and focused.
- Use Playwright-native patterns over custom abstractions.
- Use existing page object models or suggest expanding existing ones or creating new ones as needed.

## Workflow

1. Identify the user flow under test.
2. Break the flow into a single clear test intent.
3. Use semantic locators:
   - `getByRole`
   - `getByLabel`
   - `getByTestId`
   - `locator`
4. Rely on Playwright auto-waiting instead of manual delays.
5. Add assertions only for meaningful outcomes.
6. Keep setup inside `test.beforeEach` or fixtures.
7. Use UI page object models to perform UI actions instead of within the test.

## Rules

- Never use `waitForTimeout` unless explicitly debugging.
- Prefer `expect(locator).toBeVisible()` over manual waits.
- Avoid brittle selectors (CSS chains, nth-child).
- Do not combine multiple unrelated assertions in one test.
- Keep page objects minimal or avoid them unless necessary.

## Output style

- Provide a complete test snippet.
- Include clear comments explaining each step.
- Keep code minimal but production-ready.
