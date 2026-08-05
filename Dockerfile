# ---- builder: installs deps, compiles better-sqlite3's native binding ----
FROM node:22-alpine AS builder
WORKDIR /app

# better-sqlite3 unconditionally runs node-gyp on install (its binding.gyp
# triggers this regardless of the bundled prebuilds), so a compiler toolchain
# is required at build time. It's confined to this stage only.
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# ---- test-runner: full devDependencies + tests/, for the Playwright/Allure CronJob ----
# Built from Playwright's own image, not node:22-alpine: Chromium's shared-library
# dependencies are painful/unsupported on musl libc, and this image ships browsers
# preinstalled with matching OS deps, avoiding a separate `playwright install --with-deps`
# step. Version pinned to match @playwright/test's ^1.62.0 devDependency — bump together.
#
# Deliberately placed BETWEEN builder and runtime, not after: `docker build .` with no
# --target builds whichever stage is physically last in this file, and that must stay the
# production `runtime` stage (used by `npm run docker:build` and CI's plain `docker build`)
# — this stage is only ever built explicitly via `--target test-runner`.
FROM mcr.microsoft.com/playwright:v1.62.0-noble AS test-runner
WORKDIR /app

# This stage's base is glibc (Ubuntu), not musl (Alpine) — builder's compiled
# better-sqlite3 binding above is NOT ABI-compatible here, so this stage does its own full
# `npm ci` rather than COPYing node_modules from builder. better-sqlite3 unconditionally
# runs node-gyp on install (see builder stage's comment), so a compiler toolchain is needed
# here too — Playwright's image doesn't ship one by default.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY server.js ./
COPY src ./src
COPY public ./public
COPY tests ./tests
COPY playwright.config.js ./
COPY custom-workout-plan.md ./
COPY scripts/run-tests-and-report.js ./scripts/run-tests-and-report.js

RUN chown -R pwuser:pwuser /app
USER pwuser
ENV CI=true
CMD ["node", "scripts/run-tests-and-report.js"]

# ---- runtime: slim image, no compiler toolchain, non-root user ----
FROM node:22-alpine AS runtime
WORKDIR /app

# Fixed numeric UID/GID (not just `-S` system-user auto-allocation): Kubernetes'
# `securityContext.runAsNonRoot: true` can only verify a container is non-root when it
# can compare against a NUMERIC runAsUser — an image `USER` set to a name-only account
# fails admission ("cannot verify user is non-root"), confirmed against a real cluster
# while building this image's Kubernetes manifests. 1001/1001, not 1000/1000: node:22-alpine
# already ships a built-in `node` user/group at 1000, which addgroup/adduser would collide
# with. k8s/05-deployment.yaml and helm/ritual-ledger's templates reference 1001 explicitly
# via runAsUser/runAsGroup/fsGroup.
RUN addgroup -g 1001 -S ritual && adduser -u 1001 -S ritual -G ritual

COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY src ./src
COPY public ./public
COPY custom-workout-plan.md ./

# Bakes in a snapshot of the Allure QA report so the image is self-contained
# for hosting. Run `npm run test:e2e:report` before building to include a
# real report; otherwise `npm run docker:build` writes a placeholder so this
# COPY never fails on a missing (gitignored, generated) directory. Local
# docker-compose additionally bind-mounts allure-report/ over this so it
# updates live without a rebuild.
COPY allure-report ./allure-report

RUN mkdir -p data && chown -R ritual:ritual /app

USER ritual
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
