---
name: playwright-ci-optimizer
description: >
  Use this skill for optimizing Playwright test execution in CI pipelines,
  including parallelism, sharding, caching, and stability improvements.
  Prefer it when working with CI configs, slow pipelines, or test scaling.
---

# Playwright CI Optimizer

Use this skill to make :contentReference[oaicite:2]{index=2} test suites fast and stable in CI.

## Goals

- Reduce total pipeline runtime.
- Maximize parallel execution.
- Improve reliability in CI environments.

## Workflow

1. Analyze current test runtime and bottlenecks.
2. Enable parallel execution:
   - `fullyParallel: true`
3. Split workload using sharding:
   - `--shard=1/N`
4. Configure browser projects if needed.
5. Optimize artifacts:
   - traces only on failure
6. Cache dependencies and browsers.
7. Ensure tests are isolated and stateless.

## Rules

- Default to headless execution in CI.
- Avoid hitting real external APIs.
- Cache Playwright browsers between runs.
- Do not run tests serially unless required.
- Limit traces and logs to failure cases.

## Output style

- Summarize CI issue in one sentence.
- Show improved config snippet (Playwright or CI YAML).
- Focus on measurable improvements (speed, stability).
