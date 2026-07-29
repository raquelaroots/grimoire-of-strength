#!/usr/bin/env bash
set -euo pipefail

if [[ "${claude_CLI:-}" != "1" ]]; then
  exit 0
fi

tool_name="${claude_TOOL_NAME:-}"

case "${tool_name}" in
  write_file|replace)
    printf '[claude hook] reminder: inspect target files before writing when practical\n' >&2
    ;;
esac
