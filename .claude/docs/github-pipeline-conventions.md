# GitHub Pipeline Conventions

These conventions exist so claude CLI can reason about pipeline changes using local rules instead of generic CI advice.

## Goals

- Keep pipelines predictable.
- Make job selection logic obvious.
- Reduce flaky behavior caused by unclear caches, artifacts, or environment assumptions.

## Rules and Job Selection

- Prefer explicit `rules` over legacy `only/except` for new work.
- Branch and merge-request behavior should be obvious from the YAML.
- If a job exists for one pipeline type only, encode that directly rather than relying on side effects.

## Caches vs Artifacts

- Use caches for reusable dependencies and build acceleration.
- Use artifacts only when downstream jobs need concrete outputs from upstream jobs.
- Do not treat caches as a transport mechanism between stages.
- Keep cache keys stable and intentional.

## Docker in CI

- If a job builds Docker images, make the execution model explicit:
  - Docker-in-Docker
  - socket binding
  - other container-build strategy
- Assume Alpine-oriented images by default when the pipeline is building project containers.

## Job Design

- Keep jobs small and single-purpose where practical.
- Name jobs so their purpose is obvious from the pipeline UI.
- Avoid hidden coupling between jobs.
- Prefer explicit dependencies when stage ordering alone is not enough.

## Review Priorities

When reviewing `.GitHub-ci.yml`, prioritize:

1. whether the right jobs run at the right times
2. cache and artifact correctness
3. deterministic environment setup
4. pipeline readability and maintenance cost
