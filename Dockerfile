# ---- builder: installs deps, compiles better-sqlite3's native binding ----
FROM node:22-alpine AS builder
WORKDIR /app

# better-sqlite3 unconditionally runs node-gyp on install (its binding.gyp
# triggers this regardless of the bundled prebuilds), so a compiler toolchain
# is required at build time. It's confined to this stage only.
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# ---- runtime: slim image, no compiler toolchain, non-root user ----
FROM node:22-alpine
WORKDIR /app

RUN addgroup -S ritual && adduser -S ritual -G ritual

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
