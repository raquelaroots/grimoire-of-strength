# Playwright Conventions

These conventions exist so claude CLI can produce Playwright changes that match local expectations.

## Design Priorities

- Reliability comes before speed.
- Prefer deterministic tests over realistic but unstable ones.
- Favor clarity and debuggability over abstraction.
- Use Playwright-native features instead of custom utilities where possible.

## Test Design

- Each test should validate a single behavior or user intent.
- For maintainability and hardening against UI changes, UI navigation in a test should be done through Page Object Model function calls, not within the test.
- Keep tests small, independent, and easy to reason about.
- Avoid “end-to-end everything” tests that cover multiple flows.
- Prefer explicit setup over hidden shared state.
- Use `test.beforeEach` or fixtures for repeated setup.

## Locators and Selectors

- If it exists, use inherit from a Page Object Model (POM) and use its locators.
- If no page object model exists, prefer semantic locators:
  - `getByRole`
  - `getByLabel`
  - `getByTestId`
- Avoid brittle selectors:
  - deep CSS chains
  - xpath
  - `nth-child`
  - text matching when roles are available
- Treat locator quality as a first-class concern.

## Waiting and Timing

- Rely on Playwright auto-waiting by default.
- Do not use `waitForTimeout` in production tests.
- Use assertions (`expect`) to drive waiting behavior.
- prefer `expect.soft` for tests to complete before failing
- Avoid arbitrary delays and timing assumptions.

## Network and Data Control

- Mock or intercept unstable external APIs when needed.
- Prefer deterministic test data over live environments.
- Avoid coupling tests to external system availability.
- Use `page.route` for network control when stability matters.

## Test Isolation

- Tests must not depend on execution order.
- Avoid shared mutable state between tests.
- Ensure each test can run independently and in parallel.
- Clean up or reset state explicitly when required.

## CI Behavior

- Tests should pass consistently in headless environments.
- Do not rely on local-only behavior (timing, environment, data).
- Prefer parallel execution unless there is a clear constraint.
- Limit traces, videos, and logs to failure scenarios.

## Debugging and Observability

- Use Playwright trace viewer for failures.
- Prefer reproducible failures over intermittent ones.
- Add verbose logging when it improves diagnosis.
- Include test data being used in debug logs.
- Avoid masking issues with retries or extended timeouts.

## Review Priorities

When reviewing Playwright code, prioritize:

1. test determinism and flake resistance
2. locator quality and stability
3. correct use of async and waiting
4. test isolation and independence
5. clarity and maintainability of test intent
