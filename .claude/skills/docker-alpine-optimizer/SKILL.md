---
name: docker-alpine-optimizer
description: >
  Use this skill for Alpine-based Dockerfiles, image size reductions, multi-stage
  builds, musl/glibc compatibility review, package selection, and runtime-image
  cleanup. Prefer it when the request is specifically about Alpine containers or
  keeping Docker images minimal.
---

# Docker Alpine Optimizer

Use this skill when a Docker task is specifically about Alpine, image size, or lean runtime images.

## Goals

- Keep Alpine-based images small and predictable.
- Preserve compatibility instead of forcing Alpine where it does not fit.
- Prefer builder/runtime separation.

## Workflow

1. Read:
   - `Dockerfile`
   - `.dockerignore`
   - `compose.yml` or `docker-compose.yml` if present
   - build scripts referenced by the image
2. Determine whether the issue is about:
   - package selection
   - layer ordering
   - multi-stage structure
   - runtime compatibility
   - unnecessary files copied into the image
3. Check for:
   - broad `COPY . .` too early in the Dockerfile
   - build dependencies leaking into the runtime stage
   - missing non-root execution
   - musl vs glibc problems for binaries or native modules

## Rules

- Assume Alpine is the preferred target unless there is a concrete compatibility problem.
- If Alpine is a poor fit, explain why directly.
- Prefer the smallest viable edit that improves build speed or runtime size.
- Call out package-install additions separately for build and runtime stages.

## Output style

- Start with the main Alpine-specific issue.
- Then show the smallest Dockerfile change.
- Then list any compatibility risks that remain.
