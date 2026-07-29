# claude CLI Agent Patterns

This document explains the practical patterns for creating specialist behavior in claude CLI.

The short version is that claude CLI does not primarily ask you to define a standalone "agent file" and then invoke that agent by name. Instead, you shape behavior by combining global context, skills, commands, hooks, and local docs.

## The Main Building Blocks

### `claude.md`

This is the broadest project-level context file.

Use it for:
- repository purpose
- global expectations
- persistent priorities
- broad stack assumptions

Think of it as the default brief the CLI should always carry in this repo.

### `.claude/agent/system.md`

This is the project-level system prompt override.

Use it for:
- behavior constraints
- response style
- what the agent should prioritize or avoid
- general rules about where it should focus

Think of it as the repo’s operating policy for the CLI.

### `.claude/skills/*/SKILL.md`

Skills are the best fit for specialist behavior.

Use them for:
- role-specific procedures
- stack-specific heuristics
- review criteria
- workflows that apply only to certain tasks

Examples:
- Docker Alpine reviewer
- GitHub rules debugger
- Playwright test author

Think of a skill as a reusable specialist playbook.

### `.claude/agent/commands/*.toml`

Commands are the main invocation surface for repeatable behavior.

Use them for:
- one-shot workflows
- specialist prompts you want to trigger on demand
- repeatable entry points like `/GitHub:rules-debug`

Think of a command as the trigger you actually type.

### `.claude/hooks/*.sh`

Hooks are not specialists. They are guardrails and context nudges.

Use them for:
- warnings
- safety reminders
- small bits of repo-state awareness
- stack-specific context injection

Think of hooks as runtime guardrails around the agent.

### `docs/*.md`

These are plain local context files.

Use them for:
- conventions
- runbooks
- review heuristics
- MCP plans
- Web Fetch recipes

Think of them as the knowledge base the CLI can read from.

## The Standard Pattern For Specialist Behavior

If you want a “specialist agent,” the most standard claude CLI pattern is:

1. Write a skill for the specialist’s behavior.
2. Optionally write a command that invokes that specialist workflow directly.
3. Keep conventions in local docs so both the skill and the command can refer to the same source of truth.

In this repo, that looks like:

- `docs/playwright-conventions.md`
- `.claude/skills/playwright-test-author/SKILL.md`
- `.claude/agent/commands/docker/alpine-review.toml`

That combination effectively behaves like a reusable Playwright specialist.

## How Skills Usually Get Used

Yes, one common pattern is for a command to tell claude to read a relevant local conventions doc or act like a specialist.

But more broadly, skills are useful in three ways:

1. The CLI may use them when the task clearly matches the skill’s description.
2. You can explicitly ask for them in your prompt.
3. You can create commands that are clearly aligned with a specific skill.

So the most reliable practical pattern is:

- use a narrow skill
- give it a specific description
- create a matching command

That makes activation easier and more repeatable than relying on implicit matching alone.

## Good Practical Patterns

### Pattern: Specialist Reviewer

- skill defines the review lens
- command provides a repeatable entry point
- conventions doc defines local standards

Example:
- `playwright-ci-optimizer`
- `docs/playwright-conventions.md`

### Pattern: Ops Assistant

- skill defines Docker or CI troubleshooting procedure
- command gives you a fast invocation path
- hooks add safety/context reminders

Example:
- `GitHub-rules-debugger`
- `/GitHub:rules-debug`
- `inject-GitHub-context.sh`

## What Is Closest To “Agents In Markdown”?

If you specifically want “define behavior in markdown,” the nearest concept in claude docs is **guidelines** in `.claude/guidelines/`.

Those are documented as markdown files that shape behavior, workflow rules, and tool instructions.

In practice:
- `claude.md` is broad project context
- `system.md` is system-level behavior shaping
- `SKILL.md` is specialist behavior
- `guidelines/*.md` is another markdown-based behavior layer
- `commands/*.toml` is how you trigger repeatable workflows

## Recommended Usage Strategy

If you are new to claude CLI, the simplest working mental model is:

1. Put stable repo-wide assumptions in `claude.md`.
2. Put sharper behavior rules in `.claude/agent/system.md`.
3. Put specialist logic in `.claude/skills/`.
4. Put easy entry points in `.claude/agent/commands/`.
5. Put team knowledge in `docs/`.
6. Use hooks only for lightweight reminders and safeguards.

That is the model this repository is built around.
