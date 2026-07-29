#!/usr/bin/env bash
set -euo pipefail

if [[ "${claude_CLI:-}" != "1" ]]; then
  exit 0
fi

tool_name="${claude_TOOL_NAME:-unknown}"

# Keep this hook non-blocking and fast; it only surfaces extra visibility.
case "${tool_name}" in
  run_shell_command|write_file|replace)
    printf '[claude hook] about to use tool=%s\n' "${tool_name}" >&2
    ;;
esac
