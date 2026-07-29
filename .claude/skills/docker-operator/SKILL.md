---
name: docker-operator
description: >
  Use this skill for Dockerfile work, Docker Compose tasks, container debugging,
  image size reductions, bind mount issues, networking questions, and terminal-first
  container workflows. Prefer it when the request involves Docker commands,
  local containers, image builds, or runtime diagnosis.
---

# Docker Operator

Use this skill when the task is mainly about Docker behavior or Docker-oriented project setup.

## Goals

- Produce commands that are safe to inspect before running.
- Prefer deterministic builds, minimal images, and explicit tags.
- Explain container failures in terms of build context, filesystem layout, networking, environment, and entrypoints.

## Workflow

1. Identify whether the problem is about build, run, networking, storage, or orchestration.
2. Inspect the relevant files first:
   - `Dockerfile`
   - `docker-compose.yml` or `compose.yml`
   - `.dockerignore`
   - scripts invoked by image entrypoints
3. When suggesting commands, prefer this order:
   - `docker compose config`
   - `docker compose build`
   - `docker build`
   - `docker run`
   - `docker logs`
   - `docker exec`
   - `docker inspect`
4. If the task is optimization, check for:
   - oversized build contexts
   - unnecessary package installs
   - missing multi-stage builds
   - root-user defaults
   - cache misses caused by file ordering

## Rules

- Default to multi-stage builds for TypeScript applications unless the user clearly needs a dev image.
- Prefer slim or distroless runtime images when practical.
- Call out host-container path mismatches explicitly.
- If a command is potentially destructive, label it clearly before suggesting it.

## Output style

- Give exact commands first.
- Then list the likely cause.
- Then propose the smallest file changes needed.
