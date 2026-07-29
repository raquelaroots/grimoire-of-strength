# Web Fetch Recipes

These recipes are for claude CLI prompts that use explicit URLs. They exist because Web Fetch works best when the prompt includes the exact pages to read and a concrete comparison task.

## General Pattern

Use prompts shaped like this:

`Read <url> and compare it against @<local-file>. List concrete mismatches only.`

## Docker Recipes

- `Read https://docs.docker.com/build/building/multi-stage/ and compare it against @Dockerfile. List opportunities to improve stage separation and cache reuse.`
- `Read https://docs.docker.com/build/cache/optimize/ and compare it against @Dockerfile and @.dockerignore. Identify cache-miss causes only.`
- `Read https://wiki.alpinelinux.org/wiki/Alpine_Package_Keeper and compare it against the package-install steps in @Dockerfile. Flag unnecessary or risky package usage.`

## GitHub Recipes

- `Read https://docs.GitHub.com/ee/ci/yaml/ and compare it against @.GitHub-ci.yml. Identify unclear or redundant job logic.`
- `Read https://docs.GitHub.com/ee/ci/jobs/job_rules.html and compare it against @.GitHub-ci.yml. Explain any branch or merge-request rule mismatches.`
- `Read https://docs.GitHub.com/ee/ci/caching/ and compare it against @.GitHub-ci.yml. Identify cache vs artifact misuse only.`

## TypeScript Recipes

- `Read https://www.typescriptlang.org/docs/handbook/2/everyday-types.html and compare it against @src. Identify weak or missing type usage.`
- `Read https://typescript-eslint.io/rules/ and compare it against @src. Suggest only high-signal idiomatic TypeScript cleanups.`
- `Read https://www.typescriptlang.org/docs/handbook/release-notes/overview.html and compare it against @src. List any breaking or deprecated features still used.`

## Playwright Recipes

- `Read https://playwright.dev/docs/writing-tests and compare it against @tests. Identify anti-patterns or brittle test logic.`
- `Read https://playwright.dev/docs/test-fixtures and compare it against @tests. Suggest improved fixture setup and teardown.`
- `Read https://playwright.dev/docs/test-assertions and compare it against @tests. Identify inefficient or unclear assertions.`
- `Read https://playwright.dev/docs/pom and compare it against @tests. Identify uses of UI navigation in tests instead of using POM objects.`

## Prompt Variants Worth Comparing

- `List concrete mismatches only.`
- `Give the smallest viable diff only.`
- `Find correctness issues before style issues.`
- `Assume the local conventions docs are authoritative if they conflict with generic guidance.`

## Notes

- Prefer one or two URLs at a time.
- Ask for comparison against specific files, not broad directories, when possible.
- If the result quality drops, reduce the scope of the prompt rather than adding more URLs.
