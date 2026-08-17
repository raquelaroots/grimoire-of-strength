# claude CLI Power User Guide

This repository is structured so claude CLI can discover project-local artifacts without relying on global configuration.

## What claude CLI will discover here

- `claude.md`: always-on workspace context
- `.claude/agent/system.md`: project-specific system behavior override
- `.claude/agent/settings.json`: workspace settings
- `.claude/hooks/*.sh`: lifecycle hooks
- `.claude/skills/*/SKILL.md`: reusable skills
- `.claude/agent/commands/**/*.toml`: custom slash commands

## Why these artifacts exist

- `claude.md` keeps the agent focused on CLI-only work in this repo.
- `system.md` makes the agent favor repo-local CLI artifacts over broader claude features.
- skills let the agent load detailed instructions only when the task matches Playwright, Docker, or GitHub CI.
- hooks add low-friction visibility around agent/tool execution.
- custom commands give you repeatable entry points for common workflows.

## Recommended starting workflow

1. Launch claude CLI inside this repo.
2. Run `/skills list` to confirm the workspace skills are visible.
3. Run `/hooks list` to confirm hooks are enabled.
4. Use `/init` only if you want claude to regenerate `claude.md`; otherwise keep the curated version in this repo.
5. Try the custom commands:
   - `/docker:diagnose`
   - `/GitHub:pipeline`

## Practical prompts

- `Create a new Playwright test for the following test steps.`
- `Add a new playwright test for this new API endpoint.`
- `Use the local Docker skill to optimize this Dockerfile for an automated Playwright test runner.`
- `Read @.GitHub-ci.yml and fix cache/artifact misuse.`

## Power-user patterns

### Use Web Fetch only when you provide URLs

Web Fetch is most useful for targeted docs retrieval, not general crawling. Give claude explicit URLs and a concrete task, for example:

`Read https://docs.docker.com/build/building/multi-stage/ and compare it against @Dockerfile.`

### Use MCP when local files are not enough

Examples that fit this repo well:

- filesystem MCP server for other local repos
- GitHub or GitHub-adjacent MCP servers if your workflow expands beyond a single checkout
- memory MCP server for persistent notes across CLI sessions

### Keep hooks fast

Hooks run synchronously. If you add logging or policy checks, keep them cheap and deterministic.

## Extending the setup

To add another skill:

1. Create `.claude/skills/<skill-name>/SKILL.md`
2. Add YAML front matter with `name` and `description`
3. Keep task instructions specific and procedural
4. Run `/skills reload`

To add another custom command:

1. Create `.claude/agent/commands/<namespace>/<name>.toml`
2. Add `description`
3. Add a `prompt` string
4. Invoke it as `/<namespace>:<name>`
