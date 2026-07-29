---
name: GitHub-rules-debugger
description: >
  Use this skill for GitHub CI `rules`, merge-request pipelines, branch conditions,
  job-selection bugs, and cases where jobs run unexpectedly or fail to run. Prefer
  it when the core problem is pipeline selection logic.
---

# GitHub Rules Debugger

Use this skill when the main GitHub problem is whether a job appears in the right pipelines.

## Goals

- Make job-selection logic explicit.
- Reduce surprises caused by overlapping or incomplete rules.
- Keep explanations concrete and tied to actual pipeline conditions.

## Workflow

1. Read `.GitHub-ci.yml` and included pipeline files first.
2. Identify the target job or jobs.
3. Inspect:
   - `rules`
   - `when`
   - `needs`
   - branch and merge-request conditions
   - whether legacy `only/except` is mixed in
4. Explain the current selection logic before proposing a fix.

## Rules

- Prefer explicit `rules` for new or corrected behavior.
- If logic is ambiguous, rewrite it into clearer conditions rather than layering on another edge case.
- Distinguish “job is skipped” from “job is never created.”
- If a fix changes pipeline behavior, say exactly which pipeline types are affected.

## Output style

- State why the job currently runs or does not run.
- Show the corrected `rules` block.
- Mention any side effects on merge-request, branch, or tag pipelines.
