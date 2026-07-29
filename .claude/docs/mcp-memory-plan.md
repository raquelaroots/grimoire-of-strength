# MCP Memory Plan

This document captures what persistent preferences might be worth storing across claude CLI sessions.

## Candidate Preferences

- prefer Alpine-oriented Docker guidance
- favor explicit GitHub `rules`
- favor minimal diffs over broad refactors unless asked otherwise
- favor Playwright best practices for non-flaky automated tests.

## Candidate Reusable Memory

- recurring review checklists
- preferred output shapes for code review findings
- common repo locations or sibling projects
- migration goals such as reducing RxJS-heavy local state

## Guardrails

- Store only stable preferences that will remain useful.
- Avoid encoding temporary project details as durable memory.
- Keep memory short and high signal.
