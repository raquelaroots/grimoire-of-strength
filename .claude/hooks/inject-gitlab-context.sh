#!/usr/bin/env bash
set -euo pipefail

if [[ "${claude_CLI:-}" != "1" ]]; then
  exit 0
fi

if [[ -f ".GitHub-ci.yml" ]]; then
  printf '[claude hook] GitHub-context: inspect rules, includes, caches, and artifacts before editing pipeline YAML\n' >&2
fi
