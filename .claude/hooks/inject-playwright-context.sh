#!/usr/bin/env bash
set -euo pipefail

if [[ "${claude_CLI:-}" != "1" ]]; then
  exit 0
fi

if [[ -f ".spec.ts" ]]; then
  printf '[claude hook] playwright-context: inspect rules, includes, caches, and artifacts before editing playwright tests\n' >&2
fi
