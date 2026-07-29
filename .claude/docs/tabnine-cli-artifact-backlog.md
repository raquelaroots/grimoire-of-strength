# claude CLI Artifact Backlog

This backlog is intentionally broad. The goal is to help you explore claude CLI as a power user by creating many small, discoverable artifacts and learning which ones materially improve your workflow.

Assumptions for this repo:
- Angular work should favor modern Angular patterns and Signals over RxJS-first designs.
- Docker work should assume Alpine-oriented builds unless there is a concrete reason not to.
- The focus is strictly on artifacts that help claude CLI behave better or become more repeatable.

## Highest-Value First

If you want to narrow quickly after experimenting, start here:

1. Add 10-15 custom slash commands for recurring tasks.
2. Add 6-8 narrow skills instead of only broad stack skills.
3. Add project convention docs that claude can read as context.
4. Add a few lightweight hooks for visibility and safety.
5. Add Web Fetch recipe docs and MCP setup notes.

## Skills Backlog

These belong in `.claude/skills/<name>/SKILL.md`.

### Docker

- `docker-alpine-optimizer`
  Focus on smaller Alpine images, package selection, libc compatibility issues, and multi-stage structure.

- `docker-layer-cache-reviewer`
  Focus on cache misses, COPY ordering, dependency layer reuse, and build speed.

- `docker-runtime-debugger`
  Focus on entrypoints, env vars, file permissions, networking, and container startup failures.

- `docker-compose-investigator`
  Focus on local Compose orchestration, service dependencies, ports, volumes, and healthchecks.

- `docker-security-hardener`
  Focus on non-root users, minimal runtime packages, secret handling, and filesystem permissions.

### GitHub CI/CD

- `GitHub-rules-debugger`
  Specialize in `rules`, branch logic, merge-request pipelines, and job selection behavior.

- `GitHub-cache-artifact-auditor`
  Specialize in the difference between caches and artifacts and how misuse affects speed and correctness.

- `GitHub-docker-build-engineer`
  Specialize in Alpine-based container builds inside GitHub pipelines.

- `GitHub-release-engineer`
  Specialize in tags, release jobs, version propagation, and changelog generation.

- `GitHub-runner-troubleshooter`
  Specialize in runner capabilities, executor assumptions, and environment mismatch issues.

### Cross-Cutting

- `monorepo-navigator`
  Focus on identifying repo structure quickly and routing work to the right files.

- `docs-runbook-author`
  Focus on turning implementation knowledge into concise markdown runbooks.

- `review-mode-strict`
  Focus on correctness, regression risk, and missing tests rather than implementation help.

- `migration-diff-planner`
  Focus on incremental migrations with minimal blast radius.

## Custom Command Backlog

These belong in `.claude/agent/commands/**`.

### Docker Commands

- `/docker:alpine-review`
  Review a Dockerfile specifically for Alpine compatibility and image size.

- `/docker:cache-check`
  Inspect build-layer structure and suggest reordering.

- `/docker:runtime-debug`
  Explain why a container likely fails at runtime and suggest the shortest debug path.

- `/docker:compose-review`
  Review `compose.yml` for service wiring, healthchecks, and local-dev ergonomics.

- `/docker:security-check`
  Review a container setup for low-effort hardening wins.

### GitHub Commands

- `/GitHub:rules-debug`
  Review why a job did or did not run.

- `/GitHub:cache-audit`
  Inspect cache/artifact usage and propose cleanup.

- `/GitHub:job-review`
  Review a specific job for speed, determinism, and readability.

- `/GitHub:release-plan`
  Turn a release flow into a concrete pipeline sequence.

- `/GitHub:docker-job`
  Review a GitHub Docker build job with Alpine assumptions in mind.

### Docs and Review Commands

- `/docs:write-runbook`
  Turn implementation details into operational documentation.

- `/docs:decision-record`
  Draft a short architecture decision record from the current code.

- `/review:strict`
  Perform a severity-ordered review with findings only.

- `/review:minimal-diff`
  Solve a task with the smallest viable change set.

- `/review:test-gap`
  Identify likely missing tests for a changed area.

## Hook Backlog

These belong in `.claude/hooks/`.

### Visibility Hooks

- `before-agent-log-repo-state.sh`
  Print branch, dirty status, and working directory before the agent starts.

- `before-tool-log-sensitive-tools.sh`
  Log only high-impact tools such as shell execution and file writes.

- `after-tool-summary.sh`
  Print a short summary after a tool call so sessions are easier to audit.

- `session-trace-file.sh`
  Append lightweight events to a local log file for later pattern review.

### Safety Hooks

- `block-protected-branch-edits.sh`
  Warn or block when on `main`, `master`, or release branches.

- `warn-on-large-write.sh`
  Detect broad file edits and tell the agent to reduce scope.

- `warn-on-destructive-shell.sh`
  Flag commands containing `rm`, `git reset`, force-push patterns, or broad delete intent.

- `require-file-read-before-write.sh`
  Encourage the agent to inspect a target file before changing it.

- `warn-on-missing-tests.sh`
  If source files are being changed without nearby tests, emit a reminder.

### Context Hooks

- `inject-playwright-context.sh`
  If `Cargo.toml` exists, print crate/workspace hints.

- `inject-GitHub-context.sh`
  If `.GitHub-ci.yml` exists, remind the agent to inspect pipeline includes and rules.

- `inject-docker-context.sh`
  If a Dockerfile exists, remind the agent that Alpine is the default assumption here.

## Context Document Backlog

These are plain markdown files. They are not special CLI artifacts, but they are high-value local context for the CLI to read.

### Stack Conventions

- `docs/docker-conventions.md`
  Capture Alpine preferences, package-install rules, base-image decisions, and runtime hardening defaults.

- `docs/GitHub-pipeline-conventions.md`
  Capture how your team uses stages, rules, caching, artifacts, releases, and deployment gating.

- `docs/playwright-conventions.md`
  Capture error-handling style, crate structure preferences, test strategy, and lint posture.

### Operational Runbooks

- `docs/docker-debug-runbook.md`
  Common Docker failure modes and how you debug them.

- `docs/GitHub-failure-patterns.md`
  Common pipeline failures, what they usually mean, and how to inspect them.

### Architectural Context

- `docs/repo-map.md`
  A human-written map of major directories and what lives where.

- `docs/decision-records/`
  Short ADR-style notes for key decisions you want claude to understand.

- `docs/known-sharp-edges.md`
  Places where the codebase or tooling routinely surprises people.

## Prompt and Persona Experiments

These are useful because claude CLI behavior often changes substantially based on global guidance.

- `claude.strict-review.md`
  A stricter review persona focused on bugs, regressions, and tests.

- `claude.small-diff.md`
  A persona that avoids broad refactors and always prefers minimal changes.

- `claude.ops-first.md`
  A persona that prioritizes shell-first diagnostics and reproducible workflows.

- `claude.docs-writer.md`
  A persona tuned for converting code and config into markdown docs.

- `claude.migration-mode.md`
  A persona tuned for incremental migrations and phased plans.

These do not have to replace `claude.md`. You can keep them as prompt libraries and paste or adapt from them.

## Web Fetch Experiment Backlog

These are best captured as recipe docs or command prompts.

- `docs/web-fetch-recipes.md`
  A cookbook of prompts that include exact URLs and desired outputs.

- Compare Alpine package docs against a Dockerfile.
- Compare GitHub CI docs against your `.GitHub-ci.yml`.
- Compare Playwright best practice docs against local test patterns.
- Compare TypeScript usage and idioms against local API and implementation code.
- Summarize migration guides and convert them into repo-specific checklists.
- Pull release notes and ask for likely breakages in your local config.

Good recipe pattern:

`Read <url> and compare it against @local-file. List concrete mismatches only.`

## MCP Experiment Backlog

Even before you install these on the other machine, you can plan for them here.

- `docs/mcp-filesystem-plan.md`
  Describe which sibling repos or shared config folders you may want searchable.

- `docs/mcp-GitHub-plan.md`
  Describe useful GitHub queries or metadata you would want exposed via MCP.

- `docs/mcp-docs-plan.md`
  Describe which external docs or internal docs would be useful as structured context.

- `docs/mcp-memory-plan.md`
  Describe what durable preferences or recurring patterns you want remembered.

Possible MCP experiments:

- filesystem access to sibling repositories
- GitHub-aware tooling for pipeline metadata
- persistent memory for preferred review styles
- curated internal docs access

## Evaluation Artifacts

These help you learn which artifacts are worth keeping.

- `docs/evals/command-comparison-template.md`
  Record how different custom commands behave on the same task.

- `docs/evals/skill-trigger-notes.md`
  Track which skills trigger reliably and which need better descriptions.

- `docs/evals/hook-observations.md`
  Track whether hooks are useful, noisy, or too slow.

- `docs/evals/prompt-patterns.md`
  Track which prompt shapes consistently produce good CLI behavior.

- `docs/evals/stack-specific-wins.md`
  Record where claude helped materially on Docker, GitHub, or Playwright tasks.

## Suggested First 20 Artifacts

If you want a practical first wave, build these first:

1. `docker-alpine-optimizer`
2. `docker-layer-cache-reviewer`
3. `GitHub-rules-debugger`
4. `GitHub-cache-artifact-auditor`
5. `typescript-test-author`
6. `typescript-error-handling-reviewer`
7. `playwright-test-pattern-reviewer`
8. `playwright-fixture-simplifier`
9. `/docker:alpine-review`
10. `/docker:cache-check`
11. `/GitHub:rules-debug`
12. `/GitHub:cache-audit`
13. `/typescript:test-fix`
14. `/typescript:error-review`
15. `/playwright:pattern-review`
16. `/playwright:cleanup-plan`
17. `docs/docker-conventions.md`
18. `docs/GitHub-pipeline-conventions.md`
19. `docs/typescript-conventions.md`
20. `docs/playwright-conventions.md`

## Notes on Stack Alignment

### Playwright

- Prefer robust fixture and selector idioms, and use Playwright best practices when reviewing test patterns.
- Use fixture setup/teardown and deterministic assertions as defaults.
- Recommend refactoring brittle or imperative test patterns into more maintainable, modular styles.

### Docker

- Assume Alpine unless a toolchain or binary compatibility issue makes that a poor fit.
- When reviewing Dockerfiles, explicitly check for musl/glibc compatibility, package naming, and minimal runtime contents.

### TypeScript

- Emphasize type safety, idiomatic usage, and robust error handling in all code and artifacts.
- Recommend high-signal TypeScript conventions, including accurate type annotations and everyday TS best practices.

### GitHub

- If your pipelines build Alpine-based images, it is useful to keep both Docker and GitHub artifacts aware of that shared assumption.
