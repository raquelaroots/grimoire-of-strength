#!/usr/bin/env bash
set -euo pipefail

# Lightweight context hint for debugging hook execution.
if [[ "${claude_CLI:-}" != "1" ]]; then
  exit 0
fi

printf '[claude hook] before-agent cwd=%s model=%s\n' "${PWD}" "${claude_MODEL:-unknown}" >&2
