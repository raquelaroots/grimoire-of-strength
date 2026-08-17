# claude CLI Doc Notes

These notes capture the parts of the official claude CLI docs that directly informed this repo.

## Key doc takeaways

- `claude.md` is a first-class CLI context file.
- `.claude/agent/system.md` overrides project system behavior.
- skills live in `.claude/skills` for workspace scope and are loaded on demand.
- hooks live in `.claude/hooks` and must be enabled in settings.
- custom commands live in `.claude/agent/commands` and map file paths to slash-command namespaces.
- user and workspace settings merge hierarchically through `settings.json`.
- Web Fetch works best when the prompt includes explicit URLs.
- MCP servers can be added with `claude mcp add ...` and selected at runtime with `--allowed-mcp-server-names`.

## High-value commands from the docs

```bash
/settings
/skills list
/skills reload
/hooks
/init
claude skills list
claude mcp list
claude --allowed-mcp-server-names filesystem
claude --approval-mode plan --allowed-mcp-server-names filesystem
```

## Good next experiments

- Add a filesystem MCP server for a second repo you touch often.
- Create a `GitHub-release-engineer` skill if you do frequent release tagging/versioning.
- Add a stricter hook once you know which risky commands you want to intercept.
- Create repo-specific custom commands that wrap your most common review and debugging prompts.

## Sources

- https://docs.claude.com/main/getting-started/claude-cli
- https://docs.claude.com/main/getting-started/claude-cli/features/cli-commands
- https://docs.claude.com/main/getting-started/claude-cli/features/commands
- https://docs.claude.com/main/getting-started/claude-cli/features/settings
- https://docs.claude.com/main/getting-started/claude-cli/features/hooks
- https://docs.claude.com/main/getting-started/claude-cli/features/agent-skills
- https://docs.claude.com/main/getting-started/claude-cli/features/mcp-server-config
- https://docs.claude.com/main/getting-started/claude-cli/features/web-fetch
- https://docs.claude.com/main/getting-started/claude-cli/features/subagents
