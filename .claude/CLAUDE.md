# claude CLI Workspace Context

This repository exists to hold claude CLI artifacts that improve terminal-first workflows.

Scope:
- Focus only on claude CLI customization and automation artifacts.
- Prefer project-local artifacts over global ones so experiments stay isolated to this repo.
- Treat this repository as a sandbox for testing skills, hooks, custom slash commands, and prompt guidance.

Primary technologies to optimize for:
- Playwright
- Typescript
- Docker
- Kubernetes
- Helm
- GitHub CI/CD pipelines

Operating assumptions:
- The user wants practical, executable help rather than broad product overviews.
- When multiple approaches are possible, prefer ones that work well in a terminal and CI context.
- Use repository-local context files and skills before suggesting unrelated claude features.

What good assistance looks like here:
- Generate or refine claude CLI artifacts in discoverable paths.
- Propose shell commands that are copyable and safe to review.
- Help compose or improve Playwright tests, Playwright fixtures, Dockerfiles, Compose files, GitHub pipelines, and supporting docs.
- Keep recommendations concrete, with file-level outputs when possible.

Preferred workflow:
1. Read existing `.claude/` artifacts first.
2. Use project skills when the task clearly matches Playwright, Docker, or GitHub CI.
3. Keep hooks lightweight and predictable.
4. If a request depends on external docs, prefer URL-based Web Fetch workflows or MCP servers over generic discussion.
