# MCP Filesystem Plan

This document captures ideas for filesystem-oriented MCP usage on the machine where claude CLI actually runs.

## Main Goal

Expose a few high-value local directories so claude can read adjacent repositories or shared config without copying files around.

## Good Candidates

- sibling repositories that share Docker patterns
- repositories with reusable GitHub CI templates
- shell-script or infra repositories that hold deployment conventions

## Good Questions To Answer With Filesystem MCP

- How does another repo solve the same Docker layering problem?
- Which pipeline templates already exist elsewhere?
- How does this Playwright test elegantly execute a test?

## Suggested Guardrails

- Expose only a small set of trusted directories.
- Keep the mounted scope narrow enough that search results stay relevant.
- Prefer read-oriented workflows before considering any writable integration.

## Future Setup Notes

When you configure this on the other machine, document:

- which directories are exposed
- what names you give the MCP servers
- which commands you most often run with `--allowed-mcp-server-names`
