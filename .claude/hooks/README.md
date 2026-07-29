# Hooks Overview

This directory contains lightweight claude CLI hook scripts for visibility, safety reminders, and stack-specific context injection.

These hooks are intentionally advisory. They print short messages to stderr and avoid heavy logic so they remain fast and predictable.

## Core Hooks

- `before-agent.sh`
  Prints a minimal session-start trace that includes the working directory and model identifier when available.

- `before-tool.sh`
  Logs a short message before high-impact tools such as shell execution or file writes.

- `on-error.sh`
  Prints a short error trace containing the model and tool name when a tool-level failure occurs.

## Safety and Review Hooks

- `block-protected-branch-edits.sh`
  Warns when file-writing or shell activity happens on protected branches such as `main`, `master`, or `release/*`.

- `warn-on-destructive-shell.sh`
  Warns when a shell command appears destructive, such as `rm`, `git reset --hard`, or force-push patterns.

- `require-file-read-before-write.sh`
  Reminds the agent to inspect target files before writing when practical.

- `warn-on-missing-tests.sh`
  Reminds the agent that source-code edits may require nearby test changes.

## Stack Context Hooks

- `inject-playwright-context.sh`
  Detects `.spec.ts` and reminds the agent to consider playwright conventions and best practices.

- `inject-GitHub-context.sh`
  Detects `.GitHub-ci.yml` and reminds the agent to inspect rules, includes, caches, and artifacts before editing pipeline YAML.

- `inject-docker-context.sh`
  Detects Docker-related files and reminds the agent that Alpine is the default container assumption in this repo.

## Usage Notes

- Keep hooks cheap and deterministic.
- Prefer warnings and context hints over blocking behavior unless you are confident a stricter policy is worth the friction.
- If you add more hooks later, document their purpose here so the directory remains understandable at a glance.
