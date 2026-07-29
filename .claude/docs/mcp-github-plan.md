# MCP GitHub Plan

This document captures ideas for GitHub-aware MCP usage on the machine where claude CLI runs.

## Main Goal

Make pipeline and repository metadata available without forcing every question to rely on copied YAML snippets.

## Useful MCP Capabilities

- read repository files from related projects
- inspect pipeline definitions and reusable templates
- surface CI variables, job metadata, or pipeline run context where supported
- compare release or tag patterns across repositories

## Good Questions To Answer With GitHub MCP

- Why does this pipeline differ from another team’s pipeline?
- Which reusable CI templates should this project inherit?
- How do release jobs behave in a similar repository?
- Which branches or tags are expected by downstream automation?

## Guardrails

- Keep access scoped to the repositories you actually work on.
- Avoid turning GitHub MCP into a generic search dump.
- Prefer targeted questions tied to a concrete pipeline or repository.
