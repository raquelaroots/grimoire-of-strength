#!/usr/bin/env bash
set -euo pipefail

if [[ "${claude_CLI:-}" != "1" ]]; then
  exit 0
fi

tool_name="${claude_TOOL_NAME:-}"
tool_input="${claude_TOOL_INPUT:-}"

case "${tool_name}" in
  write_file|replace)
    case "${tool_input}" in
      *"/src/"*|*"src/"*|*".rs"*|*".ts"*|*".tsx"*|*".js"*)
        printf '[claude hook] test reminder: source changes may need nearby test updates\n' >&2
        ;;
    esac
    ;;
esac
