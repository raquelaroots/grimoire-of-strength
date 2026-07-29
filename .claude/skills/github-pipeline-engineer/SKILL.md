---
name: GitHub-pipeline-engineer
description: >
  Use this skill for `.GitHub-ci.yml`, pipeline failures, job design, caching,
  artifacts, Docker-in-CI workflows, and deployment-stage troubleshooting. Prefer
  it when the task mentions GitHub CI, GitHub runners, stages, jobs, rules, or
  pipeline logs.
---

# GitHub Pipeline Engineer

Use this skill to debug, design, or tighten GitHub CI/CD behavior.

## Goals

- Reduce flaky pipelines.
- Make job logic explicit.
- Keep pipeline feedback fast and readable.

## Workflow

1. Read `.GitHub-ci.yml` and any included YAML first.
2. Identify whether the issue is caused by:
   - `rules` or `only/except`
   - stage ordering
   - cache vs artifacts confusion
   - Docker image choice
   - missing environment variables or secrets
   - runner capabilities
3. If the request is to improve a pipeline, prefer:
   - smaller, focused jobs
   - explicit `rules`
   - stable caches with clear keys
   - artifacts only when downstream jobs need concrete outputs
   - reusable anchors/templates when repetition is real

## Rules

- Distinguish caches from artifacts every time it matters.
- When Docker is used in CI, clarify whether the runner uses Docker-in-Docker, socket binding, or Kaniko/buildx-like alternatives.
- Prefer deterministic dependency install steps.
- If a job should be branch-sensitive, show the exact `rules` expression.

## Output style

- Summarize pipeline intent in one sentence.
- Name the failing stage or job.
- Provide a corrected YAML snippet or a minimal diff.
