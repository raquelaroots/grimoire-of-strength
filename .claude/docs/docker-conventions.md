# Docker Conventions

These conventions exist so claude CLI has explicit local context when working on Docker-related tasks.

## Default Assumptions

- Prefer Alpine-based images unless a compatibility issue makes that a bad fit.
- Prefer multi-stage builds for production images.
- Keep runtime images small and explicit.
- Avoid adding packages to runtime images unless they are strictly required.

## Base Image Guidance

- Prefer explicit image tags over floating tags.
- Favor Alpine variants for language/runtime bases when they are stable for the workload.
- If musl/glibc compatibility is a concern, call it out directly rather than silently switching approaches.

## Build Layout

- Put dependency-resolution steps before application source copies when possible to improve cache reuse.
- Keep build-only tools in builder stages.
- Copy only the runtime artifacts into the final image.
- Use `.dockerignore` aggressively to reduce build context size.

## Runtime Expectations

- Prefer non-root users in runtime images unless there is a concrete operational reason not to.
- Keep entrypoints simple and predictable.
- Make environment-variable requirements explicit.
- Expose only the ports the application actually uses.

## Review Priorities

When reviewing Dockerfiles or Compose files, prioritize:

1. correctness of build and runtime behavior
2. Alpine compatibility and package selection
3. image size and layer efficiency
4. security basics such as non-root execution and minimal packages

## Compose Guidance

- Keep service names stable and descriptive.
- Use healthchecks where startup order matters.
- Avoid embedding too much logic in Compose command strings.
- Prefer explicit volume and port mappings over implicit behavior.
