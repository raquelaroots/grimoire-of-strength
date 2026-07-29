#!/usr/bin/env bash
set -euo pipefail

if [[ "${claude_CLI:-}" != "1" ]]; then
  exit 0
fi

printf '[claude hook] error model=%s tool=%s\n' "${claude_MODEL:-unknown}" "${claude_TOOL_NAME:-unknown}" >&2
